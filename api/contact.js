import { createHash } from 'node:crypto'

import { CONTACT_FORM_FIELDS } from '../src/data/contact.js'
import { validateForm } from '../src/lib/validation.js'

/**
 * POST /api/contact — the enquiry endpoint.
 * ============================================================================
 * A Vercel Function (Node runtime). Vercel serves any file under `api/` at the
 * matching path automatically, so this file *is* `/api/contact`; there is no
 * router to configure. The site's catch-all SPA rewrite in `vercel.json` is
 * scoped to exclude `/api/` so it cannot shadow this route.
 *
 * It runs on the server, which is the whole point: the email provider's API key
 * lives in an environment variable and is never sent to the browser. The client
 * (`src/lib/api.js`) only ever sees a status code and a small JSON body.
 *
 * ── What it does, in order ───────────────────────────────────────────────────
 *   1. Rejects anything that is not a POST.
 *   2. Parses the JSON body, with a size ceiling.
 *   3. Drops silent bot traffic: a filled honeypot, or a form completed faster
 *      than a person can type. The latter is measured from `meta.startedAt`,
 *      which the browser records when the visitor first touches the form — never
 *      from the submission timestamp, which is created at send time and would
 *      make every real enquiry look instant.
 *   4. Validates with the *same* pure function the browser uses
 *      (`validateForm`), so client and server can never disagree about what a
 *      valid enquiry is. There is no second copy of the rules.
 *   5. Sanitises every field before it goes anywhere near an email header.
 *   6. Rate-limits per client, and de-duplicates an identical enquiry.
 *   7. Sends a notification to the company and a confirmation to the visitor.
 *
 * ── Configuration (server-only environment variables) ────────────────────────
 *   RESEND_API_KEY        required  — the Resend API key. Without it the
 *                                     endpoint answers 503 and sends nothing.
 *   CONTACT_TO_EMAIL      optional  — where notifications go.
 *                                     Default: contact@afghanfutian.com
 *   CONTACT_FROM_EMAIL    optional  — the verified sender. Default:
 *                                     "Afghan Futian Website <website@afghanfutian.com>"
 *   CONTACT_ALLOWED_ORIGIN optional — set only if the site is served from a
 *                                     different origin to this function; adds the
 *                                     CORS headers the browser then requires.
 *
 * None of these are prefixed `VITE_`, so none of them reach the browser bundle.
 *
 * ── Known limits (stated rather than hidden) ─────────────────────────────────
 * Rate limiting and de-duplication are kept in a module-scope Map. A serverless
 * platform may run several instances of this function, and each instance has its
 * own memory, so the limits are best-effort rather than absolute. That is enough
 * to stop a script hammering the form from one place; it is not a substitute for
 * a shared store if the form is ever attacked in earnest. See README → "Enquiry
 * email".
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Refuse anything larger than this before parsing it. */
const MAX_BODY_BYTES = 64 * 1024

/** Per-client submission ceiling and its window. */
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

/** An identical enquiry inside this window is treated as a repeat, not a new one. */
const DEDUPE_WINDOW_MS = 5 * 60 * 1000

/** A person cannot read a page and complete seven fields this fast. */
const MIN_FILL_MS = 3000

/** Ignore timestamps that are stale or ahead of the server clock. */
const MAX_FILL_MS = 24 * 60 * 60 * 1000

/**
 * Structured, PII-free diagnostics. Only stable reason codes, statuses and
 * provider message ids are logged — never names, addresses, message bodies,
 * API keys or raw client addresses.
 */
const log = (reason, detail = '') => {
  console.info(`[contact] ${reason}${detail ? ` ${detail}` : ''}`)
}

/* --------------------------------------------------------------------------
   In-memory state. See "Known limits" above.
   -------------------------------------------------------------------------- */
/** @type {Map<string, number[]>} client key → submission timestamps */
const hits = new Map()
/** @type {Map<string, { at: number, id: string }>} enquiry fingerprint → result */
const recent = new Map()

function prune(now) {
  for (const [key, times] of hits) {
    const kept = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
    if (kept.length) hits.set(key, kept)
    else hits.delete(key)
  }
  for (const [key, entry] of recent) {
    if (now - entry.at > DEDUPE_WINDOW_MS) recent.delete(key)
  }
}

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */

const sha256 = (value) => createHash('sha256').update(String(value)).digest('hex')

/** The client's address, as best as the platform can tell us. */
function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for']
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0] : '') ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  // Hashed, never stored raw: enough to rate-limit, not a directly identifying value.
  return sha256(ip.trim())
}

/**
 * Strip control characters, collapse whitespace, trim, and cap the length.
 *
 * Control characters are removed by codepoint rather than by a regular
 * expression: a character class spanning them is exactly the kind of pattern
 * that is easy to get subtly wrong, and the loop states the intent — keep tab
 * and the line breaks, drop the rest. Newlines are normalised to `\n` so a
 * message copied out of Windows software does not carry stray `\r` into an
 * email body.
 */
function clean(value, max = 2000) {
  if (typeof value !== 'string') return ''

  let out = ''
  for (const char of value) {
    const code = char.codePointAt(0)
    const isControl = code < 32 || code === 127
    const isAllowed = code === 9 || code === 10 || code === 13
    if (isControl && !isAllowed) continue
    out += char
  }

  return out.replace(/\r\n?/g, '\n').trim().slice(0, max)
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('too-large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function parseJsonBody(req) {
  // Vercel's Node runtime parses JSON bodies for us; a local server may not.
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString())
  }
  const raw = await readBody(req)
  return raw ? JSON.parse(raw) : {}
}

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function applyCors(req, res) {
  const allowed = process.env.CONTACT_ALLOWED_ORIGIN
  if (!allowed) return
  const origin = req.headers.origin
  if (origin && origin === allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
}

/* --------------------------------------------------------------------------
   Email
   -------------------------------------------------------------------------- */

const TO_EMAIL = () => process.env.CONTACT_TO_EMAIL?.trim() || 'contact@afghanfutian.com'
const FROM_EMAIL = () =>
  process.env.CONTACT_FROM_EMAIL?.trim() || 'Afghan Futian Website <website@afghanfutian.com>'

class MailError extends Error {
  constructor(status, code = '') {
    super(`mail service responded ${status}${code ? ` (${code})` : ''}`)
    this.status = status
    this.code = code
  }
}

async function sendEmail({ apiKey, ...message }) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    // Read only the provider's stable error `name`. The raw body can echo the
    // recipient address, so it is deliberately never logged or returned.
    let code = ''
    try {
      const body = await response.json()
      if (typeof body?.name === 'string') code = body.name.slice(0, 40)
    } catch {
      // A non-JSON error page is still an error; the status says enough.
    }
    throw new MailError(response.status, code)
  }

  const result = await response.json().catch(() => ({}))
  // An acceptance without an id is not an acceptance we can account for.
  if (typeof result?.id !== 'string' || !result.id) {
    throw new MailError(response.status, 'missing-id')
  }
  return result
}

function rows(entries) {
  return entries
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 18px 6px 0;vertical-align:top;color:#777970;font-size:12px;text-transform:uppercase;letter-spacing:.14em;white-space:nowrap">${escapeHtml(
            label,
          )}</td>
          <td style="padding:6px 0;vertical-align:top;color:#141414;font-size:15px;line-height:1.6">${escapeHtml(
            value || '—',
          ).replace(/\n/g, '<br>')}</td>
        </tr>`,
    )
    .join('')
}

/* --------------------------------------------------------------------------
   Handler
   -------------------------------------------------------------------------- */

export default async function handler(req, res) {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    return res.end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return send(res, 405, { ok: false, errors: { message: 'Method not allowed.' } })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // The integration is complete but unconfigured. Say so plainly instead of
    // pretending the message was sent.
    console.error('[contact] RESEND_API_KEY is not set — nothing was sent')
    return send(res, 503, {
      ok: false,
      errors: {
        message:
          'The email service is not configured on this deployment. Please email us directly in the meantime.',
      },
    })
  }

  let body
  try {
    body = await parseJsonBody(req)
  } catch (error) {
    if (error?.message === 'too-large') {
      return send(res, 413, { ok: false, errors: { message: 'That message is too large.' } })
    }
    return send(res, 400, { ok: false, errors: { message: 'Malformed request body.' } })
  }

  if (!body || typeof body !== 'object') {
    return send(res, 400, { ok: false, errors: { message: 'Malformed request body.' } })
  }

  /* ---- 1. Silent bot checks --------------------------------------------- */

  // A bot filled the field a person cannot see. Accept it silently: a bot that
  // is told it failed simply tries again.
  if (typeof body.website === 'string' && body.website.trim()) {
    log('drop reason=honeypot')
    return send(res, 201, { ok: true, id: null })
  }

  /*
   * Timing protection measures how long the visitor spent filling the form.
   * `submittedAt` is stamped when the request is built, so it can only tell us
   * about network latency — using it here would drop every real enquiry. The
   * browser sends `startedAt` from the first interaction instead. If that value
   * is missing or implausible, skip the check rather than punish a legitimate
   * visitor (an older cached bundle, a clock change, an autofilled form).
   */
  const startedAt = Date.parse(body?.meta?.startedAt ?? '')
  const elapsed = Date.now() - startedAt
  if (Number.isFinite(startedAt) && elapsed >= 0 && elapsed < MIN_FILL_MS) {
    log('drop reason=too-fast', `fillMs=${elapsed}`)
    return send(res, 201, { ok: true, id: null })
  }
  if (Number.isFinite(startedAt) && (elapsed < 0 || elapsed > MAX_FILL_MS)) {
    log('timing ignored reason=implausible')
  }

  /* ---- 2. Validation, with the browser's own rules ----------------------- */

  const values = {
    name: clean(body.name, 80),
    company: clean(body.company, 120),
    email: clean(body.email, 254),
    phone: clean(body.phone, 40),
    country: clean(body.country, 80),
    service: clean(body.service, 120),
    message: clean(body.message, 2000),
  }

  const { errors, valid } = validateForm(CONTACT_FORM_FIELDS, values)
  if (!valid) {
    return send(res, 400, { ok: false, errors })
  }

  /* ---- 3. Rate limit and de-duplicate ------------------------------------ */

  const now = Date.now()
  prune(now)

  const client = clientKey(req)
  const times = hits.get(client) ?? []
  if (times.length >= RATE_LIMIT_MAX) {
    log('drop reason=rate-limited')
    return send(res, 429, {
      ok: false,
      errors: { message: 'Too many enquiries from this connection. Please try again shortly.' },
    })
  }

  const fingerprint = sha256(`${values.email}|${values.name}|${values.message}`)
  const previous = recent.get(fingerprint)
  if (previous) {
    // Already handled a moment ago. Report success without sending twice.
    log('drop reason=duplicate')
    return send(res, 201, { ok: true, id: previous.id, duplicate: true })
  }

  hits.set(client, [...times, now])

  /* ---- 4. Compose and send ---------------------------------------------- */

  const meta = {
    submittedAt: new Date(now).toISOString(),
    locale: clean(body?.meta?.locale, 40),
    path: clean(body?.meta?.path, 200),
    userAgent: clean(req.headers['user-agent'], 300),
  }

  const submitted = new Date(now).toUTCString()

  const notification = {
    from: FROM_EMAIL(),
    to: [TO_EMAIL()],
    reply_to: values.email,
    subject: `New enquiry — ${values.service} — ${values.name}`,
    text: [
      'A new enquiry was submitted on afghanfutian.com.',
      '',
      `Name:        ${values.name}`,
      `Email:       ${values.email}`,
      `Company:     ${values.company || '—'}`,
      `Telephone:   ${values.phone || '—'}`,
      `Country:     ${values.country || '—'}`,
      `Service:     ${values.service}`,
      `Submitted:   ${submitted}`,
      '',
      'Message:',
      values.message,
      '',
      `— Page: ${meta.path || '—'} · Locale: ${meta.locale || '—'}`,
      `— Client: ${sha256(client).slice(0, 12)}`,
      `— User agent: ${meta.userAgent || '—'}`,
    ].join('\n'),
    html: `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:640px">
      <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#777970">Afghan Futian — new enquiry</p>
      <table style="border-collapse:collapse;margin-top:18px">${rows([
        ['Name', values.name],
        ['Email', values.email],
        ['Company', values.company],
        ['Telephone', values.phone],
        ['Country', values.country],
        ['Service', values.service],
        ['Submitted', submitted],
      ])}</table>
      <p style="margin-top:22px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#777970">Message</p>
      <p style="white-space:pre-wrap;font-size:15px;line-height:1.65;color:#141414">${escapeHtml(
        values.message,
      )}</p>
      <p style="margin-top:26px;font-size:12px;color:#777970">Page ${escapeHtml(
        meta.path || '—',
      )} · Locale ${escapeHtml(meta.locale || '—')} · Client ${sha256(client).slice(0, 12)}</p>
    </div>`,
  }

  const confirmation = {
    from: FROM_EMAIL(),
    to: [values.email],
    reply_to: TO_EMAIL(),
    subject: 'We have your enquiry — Afghan Futian',
    text: [
      `Dear ${values.name},`,
      '',
      'Thank you for getting in touch. Your enquiry has reached us and we will come back to you at this address.',
      '',
      'For your records, this is what you sent:',
      '',
      `Service:  ${values.service}`,
      `Company:  ${values.company || '—'}`,
      `Country:  ${values.country || '—'}`,
      '',
      values.message,
      '',
      `Submitted ${submitted}.`,
      '',
      'Afghan Futian',
      TO_EMAIL(),
    ].join('\n'),
    html: `<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:640px">
      <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#777970">Afghan Futian</p>
      <h1 style="font-size:22px;color:#141414;margin:14px 0 0">Thank you — your enquiry has reached us.</h1>
      <p style="font-size:15px;line-height:1.65;color:#141414">Dear ${escapeHtml(
        values.name,
      )}, we will come back to you at this address. For your records, this is what you sent.</p>
      <table style="border-collapse:collapse;margin-top:18px">${rows([
        ['Service', values.service],
        ['Company', values.company],
        ['Country', values.country],
        ['Submitted', submitted],
      ])}</table>
      <p style="margin-top:22px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#777970">Message</p>
      <p style="white-space:pre-wrap;font-size:15px;line-height:1.65;color:#141414">${escapeHtml(
        values.message,
      )}</p>
      <p style="margin-top:26px;font-size:13px;color:#777970">Afghan Futian · ${escapeHtml(
        TO_EMAIL(),
      )}</p>
    </div>`,
  }

  const errorDetail = (error) =>
    `status=${error?.status ?? 'unknown'}${error?.code ? ` code=${error.code}` : ''}`

  let notificationId
  try {
    const result = await sendEmail({ apiKey, ...notification })
    notificationId = result.id
    log('accepted notification', `id=${notificationId}`)
  } catch (error) {
    log('failed notification', errorDetail(error))
    // The enquiry never reached the company. Do not tell the visitor it did.
    return send(res, 502, {
      ok: false,
      errors: {
        message: 'We could not hand your enquiry to our mail service. Please email us directly.',
      },
    })
  }

  // The confirmation is a courtesy. If it fails, the enquiry is still delivered,
  // so the visitor is told the truth — that it arrived — rather than an error.
  try {
    const result = await sendEmail({ apiKey, ...confirmation })
    log('accepted confirmation', `id=${result.id}`)
  } catch (error) {
    log('failed confirmation', errorDetail(error))
  }

  recent.set(fingerprint, { at: now, id: notificationId })

  return send(res, 201, { ok: true, id: notificationId })
}
