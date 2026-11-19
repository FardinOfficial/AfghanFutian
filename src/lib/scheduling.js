import { COMPANY, siteUrl } from '../data/company.js'

/**
 * SCHEDULING — shared, provider-free helpers.
 *
 * Pure functions only. The browser uses them to render real Cal.com data in a
 * visitor's chosen timezone; the server uses the same validation constants so
 * client and backend cannot disagree about what a bookable slot is.
 *
 * No availability is invented here. Every slot shown by the UI comes from
 * `/api/schedule/availability`, which reads it from Cal.com at request time.
 */
export const SCHEDULE_EVENT = {
  id: '7982708',
  title: 'Afghan Futian Trading Company — Meeting',
  durationMinutes: 30,
  minNoticeMinutes: 120,
  organizer: COMPANY.legalName,
  location: 'Google Meet',
  companyTimeZone: 'Asia/Kabul',
}

export const SCHEDULE_ROUTES = {
  book: '/schedule',
  confirmed: '/schedule/confirmed',
  manage: '/schedule/manage',
}

/** The states a real booking can be in, as returned by Cal.com. */
export const BOOKING_STATUS = {
  confirmed: 'confirmed',
  accepted: 'accepted',
  pending: 'pending',
  cancelled: 'cancelled',
}

const FALLBACK_ZONES = [
  'Asia/Kabul',
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Dublin',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export function resolvedTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** A useful, bounded timezone list: browser-local, company zone, then common zones. */
export function timezoneOptions() {
  const local = resolvedTimeZone()
  let all = FALLBACK_ZONES
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      all = Intl.supportedValuesOf('timeZone')
    } catch {
      // Older browsers and runtimes get the curated list above.
    }
  }
  const zones = [...new Set([local, SCHEDULE_EVENT.companyTimeZone, ...all])]
  return zones.map((value) => ({ value, label: value.replaceAll('_', ' ') }))
}

function formatter(timeZone, options) {
  const zone = timeZone || 'UTC'
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: zone, ...options })
  } catch {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options })
  }
}

export function formatDate(iso, timeZone, options = {}) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return formatter(timeZone, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatTime(iso, timeZone, { hour12 = true } = {}) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return formatter(timeZone, {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12,
  })
    .format(date)
    .replace(/\u202f/g, ' ')
}

export function formatSlotRange(startIso, endIso, timeZone, options = {}) {
  if (!startIso || !endIso) return ''
  return `${formatTime(startIso, timeZone, options)} – ${formatTime(endIso, timeZone, options)}`
}

/**
 * A Gregorian month grid keyed in UTC so a visitor west of Greenwich never sees
 * the previous month. `weekStartsOn` uses the same numbering as Date#getUTCDay:
 * 0 for Sunday (the Cal.com booking calendar) and 1 for Monday.
 */
export function calendarMonthGrid(year, monthIndex, weekStartsOn = 0) {
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const offset = (first.getUTCDay() - weekStartsOn + 7) % 7
  const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ]
}

/** Short zone label such as `GMT+4:30`, computed for the actual instant. */
export function zoneLabel(iso, timeZone) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return timeZone
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date)
    return parts.find((part) => part.type === 'timeZoneName')?.value || timeZone
  } catch {
    return timeZone
  }
}

/**
 * A slot is only offered when it is far enough in the future and still in the
 * future. The 120-minute rule mirrors the Cal.com event configuration so the UI
 * never offers a slot the backend would reject.
 */
export function isSlotBookable(startIso, now = Date.now()) {
  const start = Date.parse(startIso)
  if (!Number.isFinite(start)) return false
  return start - now >= SCHEDULE_EVENT.minNoticeMinutes * 60 * 1000
}

/** The date key Cal.com uses for grouping slots, in the selected timezone. */
export function dateKeyInZone(iso, timeZone) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Build the management URL used in branded emails. The token is a signed capability. */
export function manageUrl(token) {
  return `${siteUrl(SCHEDULE_ROUTES.manage)}?token=${encodeURIComponent(token)}`
}

/** Google Calendar's official templated event URL — no API key required. */
export function addToCalendarUrl({ start, end, title, description, location, meetingUrl }) {
  const toIcs = (value) => new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || SCHEDULE_EVENT.title,
    dates: `${toIcs(start)}/${toIcs(end)}`,
    details: [description, meetingUrl && `Join: ${meetingUrl}`].filter(Boolean).join('\n\n'),
    location: location || SCHEDULE_EVENT.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default {
  SCHEDULE_EVENT,
  SCHEDULE_ROUTES,
  BOOKING_STATUS,
  resolvedTimeZone,
  timezoneOptions,
  formatDate,
  formatTime,
  formatSlotRange,
  calendarMonthGrid,
  isSlotBookable,
  dateKeyInZone,
  manageUrl,
  addToCalendarUrl,
}
