import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SCHEDULE_EVENT,
  addDaysToDateKey,
  addToCalendarUrl,
  availabilityWindow,
  calendarMonthGrid,
  dateKeyInZone,
  defaultTimeZone,
  formatSlotRange,
  formatTime,
  isSlotBookable,
  manageUrl,
  timeZoneLabel,
  timezoneOptions,
  zoneLabel,
} from './scheduling.js'

test('the event contract stays fixed', () => {
  assert.equal(SCHEDULE_EVENT.id, '7982708')
  assert.equal(SCHEDULE_EVENT.durationMinutes, 30)
  assert.equal(SCHEDULE_EVENT.minNoticeMinutes, 120)
  assert.equal(SCHEDULE_EVENT.location, 'Google Meet')
  assert.equal(SCHEDULE_EVENT.companyTimeZone, 'Asia/Kabul')
})

test('a slot is only bookable after the 120-minute notice window', () => {
  const now = Date.parse('2026-11-19T12:00:00Z')
  assert.equal(isSlotBookable('2026-11-19T13:59:00Z', now), false)
  assert.equal(isSlotBookable('2026-11-19T14:00:00Z', now), true)
  assert.equal(isSlotBookable('not-a-date', now), false)
})

test('date keys and slot ranges follow the visitor timezone', () => {
  // 01:30 UTC is still the previous day in Los Angeles.
  assert.equal(dateKeyInZone('2026-11-19T01:30:00Z', 'America/Los_Angeles'), '2026-11-18')
  assert.equal(dateKeyInZone('2026-11-19T01:30:00Z', 'Asia/Kabul'), '2026-11-19')

  const range = formatSlotRange('2026-11-19T09:00:00Z', '2026-11-19T09:30:00Z', 'UTC')
  assert.match(range, /9:00\s?am.*9:30\s?am/i)
})

test('the time format toggle changes slot labels without changing the instant', () => {
  const start = '2026-11-19T21:00:00Z'
  const end = '2026-11-19T21:30:00Z'
  assert.match(formatTime(start, 'UTC', { hour12: false }), /^21:00$/)
  assert.equal(formatTime('2026-11-20T00:30:00Z', 'UTC', { hour12: false }), '00:30')
  assert.match(formatSlotRange(start, end, 'UTC', { hour12: false }), /21:00.*21:30/)
  assert.match(formatSlotRange(start, end, 'UTC', { hour12: true }), /9:00.*9:30/i)
})

test('calendar grids support the Cal.com Sunday-first week', () => {
  // 1 November 2026 is a Sunday.
  const november = calendarMonthGrid(2026, 10, 0)
  assert.equal(november[0], 1)
  assert.equal(november.filter(Boolean).length, 30)
  assert.equal(november.at(-1), 30)

  // The same month starts on the last column in a Monday-first grid.
  const mondayFirst = calendarMonthGrid(2026, 10, 1)
  assert.equal(mondayFirst[0], null)
  assert.equal(mondayFirst[5], null)
  assert.equal(mondayFirst[6], 1)
})

test('timezone options are unique, valid and start with the company zone', () => {
  const zones = timezoneOptions()
  const values = zones.map((zone) => zone.value)
  assert.equal(new Set(values).size, values.length)
  assert.equal(values[0], 'Asia/Kabul')
  assert.equal(zones[0].label, 'Kabul, Afghanistan')
  for (const zone of zones) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en-GB', { timeZone: zone.value }))
  }
})

test('Kabul is the default timezone and its offset is displayed explicitly', () => {
  assert.equal(defaultTimeZone(), 'Asia/Kabul')
  assert.equal(timeZoneLabel('Asia/Kabul'), 'Kabul, Afghanistan')
  assert.equal(zoneLabel('2026-11-19T09:00:00.000Z', 'Asia/Kabul'), 'GMT+04:30')

  // 21:00 UTC is already 01:30 on the next day in Kabul. No manual offset is
  // applied: Intl does the conversion from the exact instant.
  assert.equal(formatTime('2026-11-19T21:00:00.000Z', 'Asia/Kabul', { hour12: false }), '01:30')
  assert.equal(dateKeyInZone('2026-11-19T21:00:00.000Z', 'Asia/Kabul'), '2026-11-20')
  assert.equal(formatSlotRange('2026-11-19T09:00:00.000Z', '2026-11-19T09:30:00.000Z', 'Asia/Kabul', { hour12: false }), '13:30 – 14:00')
})

test('availability dates are computed in the selected timezone, never UTC', () => {
  const now = Date.parse('2026-11-19T20:15:00.000Z') // 00:45 in Kabul on the 20th
  assert.equal(dateKeyInZone(new Date(now).toISOString(), 'Asia/Kabul'), '2026-11-20')
  assert.deepEqual(availabilityWindow('Asia/Kabul', now), {
    from: '2026-11-20',
    to: '2026-12-20',
  })
  assert.equal(addDaysToDateKey('2026-11-30', 1), '2026-12-01')
  assert.equal(addDaysToDateKey('2028-02-28', 1), '2028-02-29')
})

test('calendar and management links are built from official data', () => {
  const calendar = addToCalendarUrl({
    start: '2026-11-19T09:00:00Z',
    end: '2026-11-19T09:30:00Z',
    title: 'Meeting',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
  })
  const url = new URL(calendar)
  assert.equal(url.hostname, 'calendar.google.com')
  assert.equal(url.searchParams.get('action'), 'TEMPLATE')
  assert.match(url.searchParams.get('details'), /meet\.google\.com/)

  const manage = new URL(manageUrl('signed.token'))
  assert.equal(manage.origin, 'https://afghanfutian.com')
  assert.equal(manage.pathname, '/schedule/manage')
  assert.equal(manage.searchParams.get('token'), 'signed.token')
})
