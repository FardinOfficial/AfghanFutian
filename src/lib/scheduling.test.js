import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SCHEDULE_EVENT,
  addToCalendarUrl,
  dateKeyInZone,
  formatSlotRange,
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
