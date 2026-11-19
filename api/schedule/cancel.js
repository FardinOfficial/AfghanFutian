import {
  CAL_API_VERSIONS,
  calRequest,
  clean,
  clientKey,
  json,
  mergeBookingViews,
  parseBody,
  preflight,
  publicError,
  rateLimit,
  readAuthorizedBooking,
  sameOrigin,
  toBookingView,
  verifyCapability,
} from '../../src/lib/schedulingServer.js'
import { cancelScheduledReminder, sendCancellationNotice } from '../../src/lib/schedulingMailer.js'

/**
 * POST /api/schedule/cancel
 *
 * Cancels a real Cal.com booking. The signed token supplied in the email is the
 * only authority accepted; a UID sent in the body cannot cancel another
 * visitor's meeting because it must match the UID embedded in the token.
 */

const hits = new Map()

export default async function handler(req, res) {
  if (preflight(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return json(res, 405, { ok: false, error: 'method_not_allowed' })
  }
  if (!sameOrigin(req, res)) return json(res, 403, { ok: false, error: 'forbidden' })
  if (!rateLimit(hits, `cancel:${clientKey(req)}`, 10)) {
    return json(res, 429, { ok: false, error: 'too_many_requests' })
  }

  let body
  try {
    body = await parseBody(req)
  } catch (error) {
    return publicError(res, error)
  }

  const token = clean(body?.token, 2000)
  const uid = clean(body?.uid, 100)
  const reason = clean(body?.reason, 300) || 'Cancelled by attendee via the website'
  const capability = verifyCapability(token, { uid })

  if (!capability) return json(res, 401, { ok: false, error: 'invalid_link' })

  try {
    // Check the attendee on the live booking before any mutation. The UID in
    // the body is already bound to the token; this also binds the email.
    const current = await readAuthorizedBooking(uid, capability)
    if (!current) return json(res, 401, { ok: false, error: 'invalid_link' })

    const booking = {
      ...mergeBookingViews(
        current,
        toBookingView(
          await calRequest(`/bookings/${encodeURIComponent(uid)}/cancel`, {
            method: 'POST',
            version: CAL_API_VERSIONS.bookings,
            body: { cancellationReason: reason },
          }),
        ),
      ),
      email: capability.email,
    }

    let emailsSent = null
    try {
      await cancelScheduledReminder(booking)
      const notice = await sendCancellationNotice(booking)
      emailsSent = notice === null ? null : true
    } catch {
      emailsSent = false
      console.error('[schedule] cancellation email failed')
    }

    return json(res, 200, { ok: true, booking, emailsSent })
  } catch (error) {
    return publicError(res, error)
  }
}
