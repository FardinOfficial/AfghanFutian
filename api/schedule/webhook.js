import { createHash } from 'node:crypto'

import { COMPANY } from '../../src/data/company.js'
import {
  json,
  readRawBody,
  signCapability,
  toBookingView,
  verifyCalSignature,
} from '../../src/lib/schedulingServer.js'
import { sendBookingEmail, sendCancellationNotice, sendRescheduleNotice } from '../../src/lib/schedulingMailer.js'

/**
 * POST /api/schedule/webhook
 *
 * Receives Cal.com lifecycle events. The signature is verified over the exact
 * raw bytes with the write-only webhook secret before anything is parsed.
 *
 * Duplicate suppression: Cal.com documents no webhook idempotency key, so we
 * deduplicate by a hash of each unique payload in a short-lived in-memory map.
 * Bookings created through our own API carry `metadata.source = 'website'` and
 * are skipped here — their branded emails were already sent by the endpoint.
 *
 * Known limit: process-local deduplication is best effort. Multiple serverless
 * instances can each see the same delivery. A durable store is the production
 * fix and is intentionally NOT introduced without approval; this is documented
 * in the README. Resend idempotency keys provide a second layer of protection.
 */

const seen = new Map()
const DEDUPE_TTL_MS = 12 * 60 * 60 * 1000

/**
 * Claim a payload before doing any work so two simultaneous deliveries cannot
 * both send mail. A failed dispatch releases the claim again: we return 500 so
 * Cal.com redelivers the same bytes, and that retry must not look like a
 * duplicate.
 */
function claim(key) {
  const now = Date.now()
  for (const [entry, at] of seen) if (now - at > DEDUPE_TTL_MS) seen.delete(entry)
  if (seen.has(key)) return false
  seen.set(key, now)
  return true
}

function release(key) {
  seen.delete(key)
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    return res.end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return json(res, 405, { ok: false, error: 'method_not_allowed' })
  }

  let raw
  try {
    raw = await readRawBody(req)
  } catch {
    return json(res, 400, { ok: false, error: 'read_failed' })
  }

  if (!verifyCalSignature(raw, req.headers?.['x-cal-signature-256'])) {
    console.info('[webhook] rejected invalid signature')
    return json(res, 401, { ok: false, error: 'invalid_signature' })
  }

  let event
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch {
    return json(res, 400, { ok: false, error: 'malformed_json' })
  }

  const key = createHash('sha256').update(raw).digest('hex')
  if (!claim(key)) {
    return json(res, 200, { ok: true, duplicate: true })
  }

  const trigger = event.triggerEvent || event.type || ''
  const source = event.payload?.metadata?.source || event.metadata?.source || ''
  if (source === 'website') {
    return json(res, 200, { ok: true, skipped: 'handled_by_website' })
  }

  const booking = toBookingView(event.payload ?? event)
  if (!booking.uid || !booking.email) {
    return json(res, 200, { ok: true, skipped: 'insufficient_payload' })
  }

  try {
    // External bookings (created in Cal.com, not through our form) still get a
    // company notification, but never a second attendee confirmation: Cal.com
    // owns that message unless its notifications are disabled in the dashboard.
    // A signed manage link makes our branded reminder actionable.
    let withCapability = booking
    try {
      withCapability = {
        ...booking,
        manageToken: signCapability({ uid: booking.uid, email: booking.email }),
      }
    } catch {
      // Missing token secret must not block the notification.
    }

    if (trigger === 'BOOKING_CREATED') {
      await sendBookingEmail('notification', withCapability, {
        to: process.env.CONTACT_TO_EMAIL?.trim() || COMPANY.email,
        idempotencyKey: `booking-notification/${booking.uid}/webhook`,
      })
    } else if (trigger === 'BOOKING_CANCELLED') {
      await sendCancellationNotice(withCapability)
    } else if (trigger === 'BOOKING_RESCHEDULED') {
      await sendRescheduleNotice(withCapability)
    } else {
      return json(res, 200, { ok: true, skipped: 'unsupported_event' })
    }
    return json(res, 200, { ok: true })
  } catch {
    // Return 500 so Cal.com retries; the signature check already proved origin.
    release(key)
    console.error('[webhook] email dispatch failed')
    return json(res, 500, { ok: false, error: 'email_failed' })
  }
}
