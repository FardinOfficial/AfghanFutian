import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SCHEDULE_EVENT,
  addToCalendarUrl,
  calendarMonthGrid,
  dateKeyInZone,
  formatSlotRange,
  formatTime,
  isSlotBookable,
  manageUrl,
  timezoneOptions,
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

test('timezone options are unique, valid and include the company zone', () => {
  const zones = timezoneOptions()
  const values = zones.map((zone) => zone.value)
  assert.equal(new Set(values).size, values.length)
  assert.ok(values.includes('Asia/Kabul'))
  for (const zone of zones) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en-GB', { timeZone: zone.value }))
  }
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
