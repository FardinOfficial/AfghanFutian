import {
  CAL_API_VERSIONS,
  calRequest,
  clientKey,
  isValidDateOnly,
  isValidTimeZone,
  json,
  preflight,
  publicError,
  rateLimit,
  sameOrigin,
} from '../lib/schedulingServer.js'
import { dateKeyInZone, isSlotBookable, SCHEDULE_EVENT } from '../../src/lib/scheduling.js'

/**
 * GET /api/schedule/availability
 * ============================================================================
 * The only source of dates and times in the scheduler is Cal.com. This route
 * proxies a narrow date window, applies the event's 120-minute notice rule, and
 * normalises the result into UTC instants grouped in the visitor's timezone.
 *
 * Nothing is cached: a slot that was booked a second ago must not be shown.
 */

const MAX_WINDOW_DAYS = 31
const MAX_HORIZON_DAYS = 90
const hits = new Map()

const METHOD_NOT_ALLOWED = { ok: false, error: 'method_not_allowed' }

function dayNumber(dateOnly) {
  return Date.parse(`${dateOnly}T00:00:00Z`) / 86_400_000
}

function normaliseSlots(data, timeZone) {
  const groups = {}
  const seen = new Set()

  for (const entries of Object.values(data ?? {})) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      const rawStart = typeof entry === 'string' ? entry : entry?.start
      const rawEnd = typeof entry === 'string' ? undefined : entry?.end
      if (!rawStart || !isSlotBookable(rawStart)) continue

      const start = new Date(rawStart)
      const end = rawEnd ? new Date(rawEnd) : new Date(start.getTime() + SCHEDULE_EVENT.durationMinutes * 60_000)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue

      // Cal.com groups by its own calendar; regroup in the visitor's zone so
      // what they pick matches the date they actually see.
      const key = dateKeyInZone(start.toISOString(), timeZone)
      const startIso = start.toISOString()
      if (!key || seen.has(startIso)) continue
      seen.add(startIso)

      ;(groups[key] ??= []).push({
        start: startIso,
        end: end.toISOString(),
      })
    }
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.start.localeCompare(b.start))
  }
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)))
}

export default async function handler(req, res) {
  if (preflight(req, res, 'GET, OPTIONS')) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return json(res, 405, METHOD_NOT_ALLOWED)
  }
  if (!sameOrigin(req, res)) return json(res, 403, { ok: false, error: 'forbidden' })
  if (!rateLimit(hits, `avail:${clientKey(req)}`, 40)) {
    return json(res, 429, { ok: false, error: 'too_many_requests' })
  }

  try {
    const url = new URL(req.url || '/', 'https://afghanfutian.com')
    const from = url.searchParams.get('from') || new Date().toISOString().slice(0, 10)
    const to = url.searchParams.get('to') || new Date(Date.now() + 13 * 86_400_000).toISOString().slice(0, 10)
    const timeZone = url.searchParams.get('timeZone') || 'UTC'
    const rescheduleUid = url.searchParams.get('rescheduleUid')?.slice(0, 100) || undefined

    const errors = {}
    if (!isValidDateOnly(from)) errors.from = 'Invalid start date.'
    if (!isValidDateOnly(to)) errors.to = 'Invalid end date.'
    if (!isValidTimeZone(timeZone)) errors.timeZone = 'Invalid timezone.'
    if (Object.keys(errors).length) return json(res, 400, { ok: false, errors })

    const today = new Date().toISOString().slice(0, 10)
    const span = dayNumber(to) - dayNumber(from)
    if (dayNumber(from) < dayNumber(today) || dayNumber(from) > dayNumber(today) + MAX_HORIZON_DAYS || span < 0 || span > MAX_WINDOW_DAYS) {
      return json(res, 400, { ok: false, error: 'date_range_out_of_bounds' })
    }

    const data = await calRequest('/slots', {
      version: CAL_API_VERSIONS.slots,
      query: {
        eventTypeId: process.env.CAL_EVENT_TYPE_ID?.trim() || '7982708',
        start: from,
        end: to,
        timeZone,
        format: 'range',
        duration: SCHEDULE_EVENT.durationMinutes,
        ...(rescheduleUid ? { bookingUidToReschedule: rescheduleUid } : {}),
      },
    })

    return json(res, 200, {
      ok: true,
      timeZone,
      window: { from, to },
      event: {
        title: SCHEDULE_EVENT.title,
        durationMinutes: SCHEDULE_EVENT.durationMinutes,
        minNoticeMinutes: SCHEDULE_EVENT.minNoticeMinutes,
        location: SCHEDULE_EVENT.location,
      },
      slots: normaliseSlots(data, timeZone),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return publicError(res, error)
  }
}
