import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import { dateKeyInZone } from '../../src/lib/scheduling.js'
import handler from './availability.js'
import { jsonResponse, request, response, routerFetch } from './testHelpers.js'

const VALID_START = new Date(Date.now() + 26 * 60 * 60 * 1000)
VALID_START.setMinutes(0, 0, 0)
const VALID = VALID_START.toISOString()
const DAY = VALID.slice(0, 10)
const NEXT = new Date(Date.parse(`${DAY}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
const SLOT_DAY = dateKeyInZone(VALID, 'Asia/Kabul')
const EXPIRED = new Date(Date.now() + 30 * 60 * 1000).toISOString()

let realFetch

beforeEach(() => {
  realFetch = globalThis.fetch
  process.env.CAL_API_KEY = 'test-cal-key'
  process.env.CAL_EVENT_TYPE_ID = '7982708'
})

afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.CAL_API_KEY
})

function availabilityRequest(overrides = {}) {
  const params = new URLSearchParams({
    from: DAY,
    to: NEXT,
    timeZone: 'Asia/Kabul',
    ...overrides.query,
  })
  return request({ url: `/api/schedule/availability?${params}`, ip: overrides.ip || '203.0.113.21' })
}

test('availability comes only from Cal.com and respects the notice rule', async () => {
  const stub = routerFetch([
    {
      pattern: /api\.cal\.com\/v2\/slots/,
      handle: () =>
        jsonResponse({
          status: 'success',
          data: {
            [DAY]: [
              { start: EXPIRED, end: new Date(Date.parse(EXPIRED) + 1_800_000).toISOString() },
              { start: VALID, end: new Date(Date.parse(VALID) + 1_800_000).toISOString() },
            ],
          },
        }),
    },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(availabilityRequest(), res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.payload.ok, true)
  assert.equal(res.payload.slots[SLOT_DAY].length, 1)
  assert.equal(res.payload.slots[SLOT_DAY][0].start, VALID)
  assert.equal(res.payload.event.minNoticeMinutes, 120)
  assert.equal(res.payload.window.from, DAY)

  const calCall = stub.calls.find((call) => call.url.includes('api.cal.com'))
  assert.ok(calCall)
  assert.equal(calCall.init.headers['cal-api-version'], '2024-09-04')
  assert.equal(calCall.init.headers.Authorization, 'Bearer test-cal-key')
  assert.equal(new URL(calCall.url).searchParams.get('eventTypeId'), '7982708')
  assert.equal(new URL(calCall.url).searchParams.get('timeZone'), 'Asia/Kabul')
  assert.equal(new URL(calCall.url).searchParams.get('format'), 'range')
  assert.doesNotMatch(JSON.stringify(res.payload), /test-cal-key/)
})

test('an empty slot response stays empty — no synthetic availability', async () => {
  const stub = routerFetch([{ pattern: /slots/, handle: () => jsonResponse({ status: 'success', data: {} }) }])
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(availabilityRequest({ ip: '203.0.113.22' }), res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.payload.slots, {})
})

test('provider failures become a generic 502 without leaking the reason', async () => {
  const stub = routerFetch([
    {
      pattern: /slots/,
      handle: () => jsonResponse({ message: 'internal secret detail' }, 500),
    },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(availabilityRequest({ ip: '203.0.113.23' }), res)

  assert.equal(res.statusCode, 502)
  assert.equal(res.payload.ok, false)
  assert.doesNotMatch(JSON.stringify(res.payload), /internal secret detail/)
})

test('out-of-range dates and invalid timezones are rejected before any provider call', async () => {
  const stub = routerFetch([])
  globalThis.fetch = stub.fetch

  const badDate = response()
  await handler(
    availabilityRequest({ ip: '203.0.113.24', query: { from: '2026-02-30', to: NEXT } }),
    badDate,
  )
  assert.equal(badDate.statusCode, 400)
  assert.ok(badDate.payload.errors.from)

  const badZone = response()
  await handler(
    availabilityRequest({ ip: '203.0.113.25', query: { timeZone: 'Mars/Olympus' } }),
    badZone,
  )
  assert.equal(badZone.statusCode, 400)
  assert.ok(badZone.payload.errors.timeZone)

  assert.equal(stub.calls.length, 0)
})

test('missing CAL_API_KEY is reported as configuration, not fake data', async () => {
  delete process.env.CAL_API_KEY
  globalThis.fetch = routerFetch([]).fetch

  const res = response()
  await handler(availabilityRequest({ ip: '203.0.113.26' }), res)

  assert.equal(res.statusCode, 503)
  assert.equal(res.payload.error, 'calendar_not_configured')
})
