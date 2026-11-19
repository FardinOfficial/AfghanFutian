import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

import { COMPANY, siteUrl } from '../../src/data/company.js'

/**
 * SERVER-ONLY SCHEDULING UTILITIES
 * ============================================================================
 * Imported exclusively by the server handlers in `server/handlers/` and the
 * Vercel Functions in `api/`. Never import it from a React component — it reads
 * secrets and uses Node crypto.
 *
 * Every request is validated before it reaches Cal.com or Resend. Only stable
 * status codes and provider error names are logged: no API keys, customer
 * details, booking UIDs or private Meet URLs.
 */

const MAX_BODY_BYTES = 16 * 1024
const RATE_LIMIT_MAX = 8
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000

/**
 * Cal.com API v2 header contract versions, taken from the official endpoint
 * references (accessed 2026-11-19). Endpoints are versioned independently; a
 * single `CAL_API_VERSION` environment variable can override all of them if a
 * deployment needs to pin an older contract.
 */
export const CAL_API_VERSIONS = {
  slots: process.env.CAL_API_VERSION || '2024-09-04',
  bookings: process.env.CAL_API_VERSION || '2026-02-25',
  bookingList: process.env.CAL_API_VERSION || '2026-05-01',
  eventTypes: process.env.CAL_API_VERSION || '2026-06-12',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export class ProviderError extends Error {
  constructor(status, code = 'provider_error') {
    super(code)
    this.status = status
    this.code = code
  }
}

const log = (reason, detail = '') => {
  console.info(`[schedule] ${reason}${detail ? ` ${detail}` : ''}`)
}

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(payload))
}

export function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8'))
  }
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new ProviderError(413, 'body_too_large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new ProviderError(400, 'malformed_json'))
      }
    })
    req.on('error', () => reject(new ProviderError(400, 'read_failed')))
  })
}

/**
 * Only the deployed site, its own Vercel preview URL, and localhost during
 * development may call these functions. `VITE_*` values are deliberately not
 * consulted here — they are public build-time values, not a trust boundary.
 */
export function sameOrigin(req, res) {
  const origin = req.headers?.origin
  if (!origin) return true // Same-origin browser requests omit Origin on GET.

  const allowed = new Set([siteUrl('/')])
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL.trim()}`)
  if (process.env.NODE_ENV !== 'production') {
    for (const host of ['localhost', '127.0.0.1']) {
      for (const port of [4173, 5173, 3000]) allowed.add(`http://${host}:${port}`)
    }
  }

  if (allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    return true
  }
  log('rejected origin')
  return false
}

/** Answer a same-origin CORS preflight with only the headers we actually use. */
export function preflight(req, res, methods = 'GET, POST, OPTIONS') {
  if (req.method !== 'OPTIONS') return false
  if (!sameOrigin(req, res)) {
    json(res, 403, { ok: false, error: 'forbidden' })
    return true
  }
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.statusCode = 204
  res.end()
  return true
}

export function clean(value, max = 200) {
  if (typeof value !== 'string') return ''
  let out = ''
  for (const char of value) {
    const code = char.codePointAt(0)
    if ((code < 32 || code === 127) && code !== 9 && code !== 10 && code !== 13) continue
    out += char
  }
  return out.replace(/\r\n?/g, '\n').trim().slice(0, max)
}

export const isValidEmail = (value) => EMAIL_PATTERN.test(value) && value.length <= 254
export const isValidIso = (value) => {
  if (typeof value !== 'string') return false
  const time = Date.parse(value)
  return Number.isFinite(time) && /^\d{4}-\d{2}-\d{2}T/.test(value)
}

export const isValidDateOnly = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const time = Date.parse(`${value}T00:00:00Z`)
  if (Number.isNaN(time)) return false
  // Date.parse normalises impossible dates (e.g. 2026-02-30); reject them.
  return new Date(time).toISOString().slice(0, 10) === value
}

export function isValidTimeZone(value) {
  if (typeof value !== 'string' || !value || value.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export function clientKey(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0] : '') ||
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  return createHash('sha256').update(String(ip).trim()).digest('hex')
}

/** Process-local rate limiter. Provider conflicts and idempotency are the durable guard. */
export function rateLimit(store, key, max = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW_MS) {
  const now = Date.now()
  const times = (store.get(key) ?? []).filter((time) => now - time < windowMs)
  if (times.length >= max) {
    store.set(key, times)
    return false
  }
  times.push(now)
  store.set(key, times)
  return true
}

/** Process-local duplicate-request guard for retried POSTs. */
export function claimIdempotency(store, key, ttl = IDEMPOTENCY_TTL_MS) {
  const now = Date.now()
  for (const [entry, at] of store) if (now - at > ttl) store.delete(entry)
  if (store.has(key)) return null
  store.set(key, now)
  return randomUUID()
}

/* --------------------------------------------------------------------------
 * Capability tokens for cancel / reschedule
 * -------------------------------------------------------------------------- */

function tokenSecret() {
  return (
    process.env.SCHEDULE_TOKEN_SECRET?.trim() ||
    process.env.CAL_API_KEY?.trim() ||
    ''
  )
}

const base64url = (value) => Buffer.from(value).toString('base64url')

/**
 * A signed, expiring capability for a booking. No customer record is stored;
 * the token is the proof that a link came from us. Cancel and reschedule always
 * re-check the UID in the token, so changing it in the body cannot affect a
 * different booking.
 */
export function signCapability({ uid, email, ttlMs = 30 * 24 * 60 * 60 * 1000 }) {
  const secret = tokenSecret()
  if (!secret) throw new ProviderError(503, 'token_secret_missing')
  const payload = {
    uid,
    email: email.toLowerCase(),
    iat: Date.now(),
    exp: Date.now() + ttlMs,
    nonce: randomUUID(),
  }
  const body = base64url(JSON.stringify(payload))
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifyCapability(token, { uid, email } = {}) {
  const secret = tokenSecret()
  if (!secret || typeof token !== 'string') return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!payload?.uid || !Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null
  if (uid && payload.uid !== uid) return null
  if (email && payload.email !== email.toLowerCase()) return null
  return payload
}

/* --------------------------------------------------------------------------
 * Provider calls
 * -------------------------------------------------------------------------- */

/** Call Cal.com API v2 with the private key kept entirely server-side. */
export async function calRequest(path, { method = 'GET', body, query, version } = {}) {
  const key = process.env.CAL_API_KEY?.trim()
  if (!key) throw new ProviderError(503, 'calendar_not_configured')

  const base = (process.env.CAL_API_BASE_URL?.trim() || 'https://api.cal.com/v2').replace(/\/$/, '')
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value))
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(version ? { 'cal-api-version': version } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    let code = 'provider_error'
    try {
      const data = await response.json()
      const message =
        typeof data?.message === 'string'
          ? data.message
          : typeof data?.error === 'string'
            ? data.error
            : typeof data?.error?.message === 'string'
              ? data.error.message
              : ''
      // Cal.com reports double bookings as 409 with a "slot taken"/conflict message.
      if (/conflict|taken|not available|unavailable|already booked/i.test(message)) code = 'slot_taken'
      else if (message) code = 'provider_rejected'
      else if (response.status === 409 || response.status === 422) code = 'slot_taken'
    } catch {
      if (response.status === 409 || response.status === 422) code = 'slot_taken'
    }
    log('cal request failed', `status=${response.status} code=${code}`)
    throw new ProviderError(response.status, code)
  }

  const data = await response.json().catch(() => ({}))
  return data?.data ?? data
}

/** Resend helper with the official branded sender and reply-to. */
export async function resendSend(message, idempotencyKey) {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) throw new ProviderError(503, 'mail_not_configured')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey.slice(0, 256) } : {}),
    },
    body: JSON.stringify({
      from:
        process.env.SCHEDULE_FROM_EMAIL?.trim() ||
        `${COMPANY.brandName} <${COMPANY.email}>`,
      reply_to: COMPANY.email,
      ...message,
    }),
  })

  if (!response.ok) {
    let code = 'mail_failed'
    try {
      const body = await response.json()
      if (typeof body?.name === 'string') code = body.name.slice(0, 40)
    } catch {}
    log('resend failed', `status=${response.status} code=${code}`)
    throw new ProviderError(response.status, code)
  }
  const result = await response.json().catch(() => ({}))
  if (!result?.id) throw new ProviderError(502, 'mail_missing_id')
  return result.id
}

/**
 * Provider errors are translated into stable public codes. A Cal.com conflict
 * must reach the browser as 409 so the UI can refresh availability, and missing
 * configuration must be visible as 503 rather than disguised as a server bug.
 */
const PUBLIC_ERROR_STATUS = {
  slot_taken: 409,
  calendar_not_configured: 503,
  mail_not_configured: 503,
  token_secret_missing: 503,
  body_too_large: 413,
  malformed_json: 400,
  read_failed: 400,
  reminder_cancel_failed: 502,
  mail_missing_id: 502,
  provider_incomplete_response: 502,
}

export function publicError(res, error) {
  if (error instanceof ProviderError) {
    // A provider's own HTTP status is not our API contract. Everything except
    // the explicit cases below becomes a generic upstream failure, so a
    // Cal.com/Resend 500 is never presented as a bug in this application.
    const status = PUBLIC_ERROR_STATUS[error.code] ?? 502
    return json(res, status, { ok: false, error: error.code })
  }
  log('unexpected error')
  return json(res, 500, { ok: false, error: 'unexpected_error' })
}

/* --------------------------------------------------------------------------
 * Webhooks
 * -------------------------------------------------------------------------- */

/** Read the exact bytes of a request body — HMACs must cover the raw payload. */
export function readRawBody(req, limit = MAX_BODY_BYTES) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body)
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body))
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(Buffer.from(JSON.stringify(req.body)))
  }
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new ProviderError(413, 'body_too_large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', () => reject(new ProviderError(400, 'read_failed')))
  })
}

/**
 * Verify Cal.com's `x-cal-signature-256` header: an HMAC-SHA256 of the raw body
 * using the webhook's write-only signing secret. Accepts both the bare hex
 * digest and the conventional `sha256=` prefix. No secret → no webhook trust.
 */
export function verifyCalSignature(rawBody, signature, secret = process.env.CAL_WEBHOOK_SECRET?.trim()) {
  if (!secret || typeof signature !== 'string') return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const received = signature.trim().replace(/^sha256=/i, '').toLowerCase()
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/* --------------------------------------------------------------------------
 * Provider data normalisation
 * -------------------------------------------------------------------------- */

/**
 * Convert a Cal.com booking object into the small, stable shape our UI and
 * email templates consume. Provider-specific fields never reach the browser.
 */
function fieldValue(responses, name) {
  const value = responses?.[name]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return typeof value.value === 'string' ? value.value : ''
  }
  return typeof value === 'string' ? value : ''
}

export function toBookingView(booking = {}) {
  const attendee =
    booking.attendees?.find((item) => item.email) ?? booking.attendees?.[0] ?? {}
  const meetingUrl =
    (typeof booking.location === 'string' && /^https?:\/\//.test(booking.location)
      ? booking.location
      : null) ||
    (typeof booking.meetingUrl === 'string' && /^https?:\/\//.test(booking.meetingUrl)
      ? booking.meetingUrl
      : null)

  // API contract versions differ: older payloads expose `start`/`end`, newer
  // ones may use `startTime`/`endTime`. Accept both without trusting either.
  const start = booking.start || booking.startTime || ''
  const end = booking.end || booking.endTime || ''

  return {
    uid: booking.uid || '',
    reference: (booking.uid || '').slice(0, 8).toUpperCase() || 'PENDING',
    title: booking.title || '',
    start,
    end,
    duration: booking.duration || 30,
    status: booking.status || 'pending',
    timeZone: attendee.timeZone || 'UTC',
    name: attendee.name || '',
    email: attendee.email || '',
    phone: attendee.phoneNumber || '',
    company:
      fieldValue(booking.bookingFieldsResponses, 'company') ||
      fieldValue(booking.bookingFieldsResponses, 'companyOrOrganisation') ||
      attendee.company ||
      '',
    purpose:
      booking.description ||
      fieldValue(booking.bookingFieldsResponses, 'purpose') ||
      fieldValue(booking.bookingFieldsResponses, 'purposeOfTheMeeting') ||
      '',
    meetingUrl,
    createdAt: booking.createdAt || '',
    source: booking.metadata?.source || '',
  }
}

/** Keep known details when a provider response omits a field in one version. */
export function mergeBookingViews(base = {}, update = {}) {
  const merged = { ...base, ...update }
  for (const key of [
    'uid',
    'reference',
    'title',
    'start',
    'end',
    'status',
    'timeZone',
    'name',
    'email',
    'phone',
    'company',
    'purpose',
    'meetingUrl',
    'createdAt',
    'source',
  ]) {
    if (!merged[key] && base[key]) merged[key] = base[key]
  }
  return merged
}

/**
 * Read the provider's current booking and make sure the signed capability still
 * belongs to its attendee. Every mutating endpoint calls this before it changes
 * anything, so a token for another address cannot cancel or move a meeting.
 */
export async function readAuthorizedBooking(uid, capability) {
  const booking = toBookingView(
    await calRequest(`/bookings/${encodeURIComponent(uid)}`, {
      version: CAL_API_VERSIONS.bookings,
    }),
  )
  if (!booking.email || booking.email.toLowerCase() !== capability.email) return null
  return booking
}

export default {
  CAL_API_VERSIONS,
  ProviderError,
  json,
  parseBody,
  sameOrigin,
  preflight,
  clean,
  isValidEmail,
  isValidIso,
  isValidDateOnly,
  isValidTimeZone,
  clientKey,
  rateLimit,
  claimIdempotency,
  signCapability,
  verifyCapability,
  calRequest,
  resendSend,
  publicError,
  readRawBody,
  verifyCalSignature,
  toBookingView,
  mergeBookingViews,
  readAuthorizedBooking,
}
