import {
  clientKey,
  json,
  preflight,
  publicError,
  rateLimit,
  readAuthorizedBooking,
  sameOrigin,
  verifyCapability,
} from '../lib/schedulingServer.js'

/**
 * GET /api/schedule/manage?token=…
 *
 * Reads a real Cal.com booking using the signed capability token emailed to
 * the attendee. The token is bound to both the booking UID and the attendee
 * email, so it cannot be swapped to inspect somebody else's reservation.
 */

const hits = new Map()

export default async function handler(req, res) {
  if (preflight(req, res, 'GET, OPTIONS')) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return json(res, 405, { ok: false, error: 'method_not_allowed' })
  }
  if (!sameOrigin(req, res)) return json(res, 403, { ok: false, error: 'forbidden' })
  if (!rateLimit(hits, `manage:${clientKey(req)}`, 30)) {
    return json(res, 429, { ok: false, error: 'too_many_requests' })
  }

  try {
    const url = new URL(req.url || '/', 'https://afghanfutian.com')
    const capability = verifyCapability(url.searchParams.get('token'))
    if (!capability?.uid || !capability?.email) {
      return json(res, 401, { ok: false, error: 'invalid_link' })
    }

    // A valid token for one address must not expose a booking if Cal.com
    // reports a different attendee (e.g. after a provider-side correction).
    const booking = await readAuthorizedBooking(capability.uid, capability)
    if (!booking) return json(res, 401, { ok: false, error: 'invalid_link' })

    const isFuture = Date.parse(booking.start) > Date.now()
    const isActive = !['cancelled', 'rejected'].includes(booking.status)

    return json(res, 200, {
      ok: true,
      booking,
      canCancel: isFuture && isActive,
      canReschedule: isFuture && isActive,
    })
  } catch (error) {
    return publicError(res, error)
  }
}
