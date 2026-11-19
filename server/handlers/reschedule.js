import {
  CAL_API_VERSIONS,
  calRequest,
  clean,
  clientKey,
  isValidIso,
  isValidTimeZone,
  json,
  mergeBookingViews,
  parseBody,
  preflight,
  publicError,
  rateLimit,
  readAuthorizedBooking,
  sameOrigin,
  signCapability,
  toBookingView,
  verifyCapability,
} from '../lib/schedulingServer.js'
import { isSlotBookable, SCHEDULE_EVENT } from '../../src/lib/scheduling.js'
import {
  cancelScheduledReminder,
  scheduleReminder,
  sendRescheduleNotice,
} from '../lib/schedulingMailer.js'

/**
 * POST /api/schedule/reschedule
 *
 * Moves a real Cal.com booking to a real, freshly verified slot. The original
 * booking UID is passed to Cal.com's slots endpoint so its own time stays
 * available during the exchange, while every other conflict remains enforced.
 */

const hits = new Map()

async function slotAvailable(uid, startIso) {
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
      bookingUidToReschedule: uid,
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
    return json(res, 405, { ok: false, error: 'method_not_allowed' })
  }
  if (!sameOrigin(req, res)) return json(res, 403, { ok: false, error: 'forbidden' })
  if (!rateLimit(hits, `reschedule:${clientKey(req)}`, 10)) {
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
  const start = clean(body?.start, 40)
  const timeZone = clean(body?.timeZone, 64)
  const capability = verifyCapability(token, { uid })
  if (!capability) return json(res, 401, { ok: false, error: 'invalid_link' })

  const errors = {}
  if (!isValidIso(start)) errors.start = 'Please choose a time.'
  else if (!isSlotBookable(start)) errors.start = 'That time no longer meets the minimum notice period.'
  if (!isValidTimeZone(timeZone)) errors.timeZone = 'Invalid timezone.'
  if (Object.keys(errors).length) return json(res, 400, { ok: false, errors })

  try {
    // Confirm the live booking still belongs to the token's attendee before
    // anything is changed. This also gives us the old time for the reminder.
    const previous = await readAuthorizedBooking(uid, capability)
    if (!previous) return json(res, 401, { ok: false, error: 'invalid_link' })

    const startIso = new Date(start).toISOString()
    if (!(await slotAvailable(uid, startIso))) {
      return json(res, 409, { ok: false, error: 'slot_taken' })
    }

    await cancelScheduledReminder(previous)

    const response = await calRequest(`/bookings/${encodeURIComponent(uid)}/reschedule`, {
      method: 'POST',
      version: CAL_API_VERSIONS.bookings,
      body: {
        start: startIso,
        reschedulingReason: 'Rescheduled by attendee via the website',
      },
    })

    // Most versions return the new booking. Older ones can return the cancelled
    // original with `rescheduledToUid`; read the replacement before confirming.
    const nextUid = response?.rescheduledToUid
    const normalized = toBookingView(
      nextUid && nextUid !== response?.uid
        ? await calRequest(`/bookings/${encodeURIComponent(nextUid)}`, {
            version: CAL_API_VERSIONS.bookings,
          })
        : response,
    )
    const booking = {
      ...mergeBookingViews(previous, normalized),
      email: capability.email,
      timeZone,
    }

    // A reschedule keeps the same attendee and capability; reissue it so links
    // work whichever UID the provider returned, and the new email carries a
    // fresh expiry.
    const manageToken = signCapability({ uid: booking.uid || nextUid || uid, email: capability.email })
    let emailsSent = null
    try {
      const notice = await sendRescheduleNotice({
        ...booking,
        email: capability.email,
        timeZone,
        manageToken,
      })
      emailsSent = notice === null ? null : true
      await scheduleReminder({ ...booking, email: capability.email, timeZone, manageToken })
    } catch {
      emailsSent = false
      console.error('[schedule] reschedule email failed')
    }

    return json(res, 200, { ok: true, booking, manageToken, emailsSent })
  } catch (error) {
    return publicError(res, error)
  }
}
