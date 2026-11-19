import { createHash } from 'node:crypto'

import {
  CAL_API_VERSIONS,
  calRequest,
  claimIdempotency,
  clean,
  clientKey,
  isValidEmail,
  isValidIso,
  isValidTimeZone,
  json,
  parseBody,
  preflight,
  publicError,
  rateLimit,
  sameOrigin,
  signCapability,
  toBookingView,
} from '../../src/lib/schedulingServer.js'
import { isSlotBookable, SCHEDULE_EVENT } from '../../src/lib/scheduling.js'
import { scheduleReminder, sendBookingConfirmation } from '../../src/lib/schedulingMailer.js'

/**
 * POST /api/schedule/book
 * ============================================================================
 * Creates a REAL reservation in Cal.com. Nothing here is simulated.
 *
 * Before creating it, the chosen instant is checked against fresh Cal.com
 * availability for that day. That closes the gap between showing a slot and
 * submitting it: if somebody else took it, or the 120-minute notice has passed,
 * the request is rejected with a specific code the UI can act on.
 *
 * Cal.com itself also performs a conflict check on creation (we never send
 * `allowConflicts`), so a provider-side race still cannot double-book.
 */

const hits = new Map()
const claims = new Map()

const METHODS = { ok: false, error: 'method_not_allowed' }

function validate(body) {
  const errors = {}
  const name = clean(body.name, 100)
  const email = clean(body.email, 254).toLowerCase()
  const phone = clean(body.phone, 40)
  const company = clean(body.company, 120)
  const purpose = clean(body.purpose, 1000)
  const timeZone = clean(body.timeZone, 64)
  const start = clean(body.start, 40)

  if (name.length < 2) errors.name = 'Please enter your full name.'
  if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.'
  if (phone && !/^\+?[\d\s().-]{6,25}$/.test(phone)) errors.phone = 'Please enter a valid phone number.'
  if (!isValidTimeZone(timeZone)) errors.timeZone = 'Please choose a valid timezone.'
  if (!isValidIso(start)) errors.start = 'Please choose a time.'
  else if (!isSlotBookable(start)) errors.start = 'That time no longer meets the minimum notice period. Please pick another.'

  return { errors, value: { name, email, phone, company, purpose, timeZone, start } }
}

/** Confirm the exact UTC instant still appears in Cal.com's live slot list. */
async function slotStillAvailable(startIso) {
  const day = startIso.slice(0, 10)
  const next = new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
  const data = await calRequest('/slots', {
    version: CAL_API_VERSIONS.slots,
    query: {
      eventTypeId: process.env.CAL_EVENT_TYPE_ID?.trim() || '7982708',
      start: day,
      end: next,
      timeZone: 'UTC',
      format: 'range',
      duration: SCHEDULE_EVENT.durationMinutes,
    },
  })

  for (const entries of Object.values(data ?? {})) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      const candidate = typeof entry === 'string' ? entry : entry?.start
      if (candidate && new Date(candidate).toISOString() === startIso) return true
    }
  }
  return false
}

export default async function handler(req, res) {
  if (preflight(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return json(res, 405, METHODS)
  }
  if (!sameOrigin(req, res)) return json(res, 403, { ok: false, error: 'forbidden' })

  let body
  try {
    body = await parseBody(req)
  } catch (error) {
    return publicError(res, error)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json(res, 400, { ok: false, errors: { message: 'Malformed request body.' } })
  }

  if (typeof body.website === 'string' && body.website.trim()) {
    // Honeypot: accept silently, create nothing, send nothing.
    return json(res, 201, { ok: true, booking: null, emailsSent: false })
  }

  if (!rateLimit(hits, `book:${clientKey(req)}`, 6)) {
    return json(res, 429, { ok: false, error: 'too_many_requests' })
  }

  const { errors, value } = validate(body)
  if (Object.keys(errors).length) return json(res, 400, { ok: false, errors })

  const emailKey = createHash('sha256')
    .update(`${clientKey(req)}|${value.email}|${value.start}`)
    .digest('hex')
  if (!claimIdempotency(claims, emailKey)) {
    return json(res, 409, { ok: false, error: 'duplicate_request' })
  }

  try {
    if (!(await slotStillAvailable(value.start))) {
      return json(res, 409, { ok: false, error: 'slot_taken' })
    }

    const startIso = new Date(value.start).toISOString()
    const created = await calRequest('/bookings', {
      method: 'POST',
      version: CAL_API_VERSIONS.bookings,
      body: {
        start: startIso,
        eventTypeId: Number(process.env.CAL_EVENT_TYPE_ID?.trim() || 7982708),
        attendee: {
          name: value.name,
          email: value.email,
          timeZone: value.timeZone,
          ...(value.phone ? { phoneNumber: value.phone } : {}),
        },
        bookingFieldsResponses: {
          company: value.company,
          purpose: value.purpose,
        },
        metadata: {
          source: 'website',
          company: value.company || '',
          purpose: value.purpose || '',
        },
      },
    })

    const normalized = toBookingView(created)
    const booking = {
      ...normalized,
      // Cal.com confirms the attendee, but some response versions omit the
      // custom answers. Keep the values we submitted for the branded email and
      // the on-screen confirmation.
      name: normalized.name || value.name,
      email: normalized.email || value.email,
      phone: normalized.phone || value.phone,
      company: normalized.company || value.company,
      purpose: normalized.purpose || value.purpose,
      timeZone: normalized.timeZone || value.timeZone,
      end:
        normalized.end ||
        new Date(Date.parse(startIso) + SCHEDULE_EVENT.durationMinutes * 60_000).toISOString(),
    }
    if (!booking.uid) {
      // An ambiguous provider response must never be reported as a reservation.
      console.error('[schedule] booking response missing uid')
      return json(res, 502, { ok: false, error: 'provider_incomplete_response' })
    }

    const manageToken = signCapability({ uid: booking.uid, email: booking.email })
    const emailBooking = { ...booking, manageToken }

    let emailsSent = false
    try {
      const outcome = await sendBookingConfirmation(emailBooking)
      // `null` means Cal.com owns the attendee email; false means our branded
      // send was expected but failed. The UI must distinguish the two.
      emailsSent = outcome.attendeeEmailsEnabled ? Boolean(outcome.confirmation) : null
      if (outcome.failed) console.error(`[schedule] ${outcome.failed} confirmation email(s) failed`)
      await scheduleReminder(emailBooking)
    } catch {
      console.error('[schedule] confirmation or reminder email failed')
    }

    return json(res, 201, {
      ok: true,
      booking: { ...emailBooking, manageToken: undefined },
      manageToken,
      emailsSent,
      emailWarning:
        emailsSent === false
          ? 'Your meeting is reserved, but we could not send the confirmation email. Please contact us directly.'
          : null,
    })
  } catch (error) {
    return publicError(res, error)
  }
}
