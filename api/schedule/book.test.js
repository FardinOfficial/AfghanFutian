import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import handler from './book.js'
import { CAL_BOOKING, futureIso, jsonResponse, request, response, routerFetch } from './testHelpers.js'

const START = futureIso(26)
const DAY = START.slice(0, 10)
const END = new Date(Date.parse(START) + 1_800_000).toISOString()

let realFetch

beforeEach(() => {
  realFetch = globalThis.fetch
  process.env.CAL_API_KEY = 'test-cal-key'
  process.env.CAL_EVENT_TYPE_ID = '7982708'
  process.env.SCHEDULE_TOKEN_SECRET = 'test-token-secret'
  process.env.RESEND_API_KEY = 'test-resend-key'
  process.env.CONTACT_TO_EMAIL = 'company@example.com'
  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS = 'false'
})

afterEach(() => {
  globalThis.fetch = realFetch
  for (const key of [
    'CAL_API_KEY',
    'CAL_EVENT_TYPE_ID',
    'SCHEDULE_TOKEN_SECRET',
    'RESEND_API_KEY',
    'CONTACT_TO_EMAIL',
    'SCHEDULE_SEND_ATTENDEE_EMAILS',
  ]) {
    delete process.env[key]
  }
})

function details(overrides = {}) {
  return {
    name: 'Amina Rahimi',
    email: 'amina@example.com',
    company: 'Rahimi Trading',
    phone: '+93 700 000 000',
    purpose: 'We would like to discuss a sourcing requirement for kitchenware.',
    timeZone: 'Asia/Kabul',
    start: START,
    ...overrides,
  }
}

function bookRequest(body = details(), ip = '203.0.113.30') {
  return request({ method: 'POST', body, ip, url: '/api/schedule/book' })
}

function availableStub({ createStatus = 201 } = {}) {
  return routerFetch([
    {
      pattern: /api\.cal\.com\/v2\/slots/,
      handle: () => jsonResponse({ status: 'success', data: { [DAY]: [{ start: START, end: END }] } }),
    },
    {
      pattern: /api\.cal\.com\/v2\/bookings/,
      handle: () =>
        createStatus === 201
          ? jsonResponse({ status: 'success', data: CAL_BOOKING(START) }, 201)
          : jsonResponse({ message: 'Slot taken by another attendee' }, createStatus),
    },
    {
      pattern: /api\.resend\.com\/emails/,
      handle: (_url, _init, calls) =>
        jsonResponse({ id: `resend_${calls.length}` }, 201),
    },
  ])
}

test('a confirmed booking is real, signed and never contains secrets', async () => {
  const stub = availableStub()
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(bookRequest(), res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.payload.ok, true)
  assert.equal(res.payload.booking.uid, CAL_BOOKING(START).uid)
  assert.equal(res.payload.booking.manageToken, undefined)
  assert.match(res.payload.manageToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  assert.equal(res.payload.emailsSent, null)

  const create = stub.calls.find((call) => call.url.includes('/v2/bookings'))
  assert.ok(create)
  assert.equal(create.init.method, 'POST')
  assert.equal(create.init.headers['cal-api-version'], '2026-02-25')
  assert.equal(create.body.eventTypeId, 7982708)
  assert.equal(create.body.start, START)
  assert.equal(create.body.attendee.email, 'amina@example.com')
  assert.equal(create.body.bookingFieldsResponses.purpose, details().purpose)
  assert.equal(create.body.metadata.source, 'website')
  assert.equal(create.body.allowConflicts, undefined)

  const mails = stub.calls.filter((call) => call.url.includes('api.resend.com'))
  assert.equal(mails.length, 1, 'provider owns attendee mail; only company notice is ours')
  assert.equal(mails[0].body.to, 'company@example.com')
  assert.equal(mails[0].body.from, 'Afghan Futian <contact@afghanfutian.com>')
  assert.equal(mails[0].body.reply_to, 'contact@afghanfutian.com')
  assert.match(mails[0].init.headers['Idempotency-Key'], /^booking-notification\//)

  const serialized = JSON.stringify(res.payload)
  assert.doesNotMatch(serialized, /test-cal-key|test-resend-key|test-token-secret/)
})

test('a slot that vanished between selection and confirmation is not booked', async () => {
  const stub = routerFetch([
    {
      pattern: /slots/,
      handle: () => jsonResponse({ status: 'success', data: {} }),
    },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(bookRequest(details(), '203.0.113.31'), res)

  assert.equal(res.statusCode, 409)
  assert.equal(res.payload.error, 'slot_taken')
  assert.equal(stub.calls.length, 1, 'no create request and no email may follow')
})

test('an expired slot is rejected before any provider call', async () => {
  const stub = routerFetch([])
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(bookRequest(details({ start: futureIso(1) }), '203.0.113.32'), res)

  assert.equal(res.statusCode, 400)
  assert.match(res.payload.errors.start, /minimum notice/)
  assert.equal(stub.calls.length, 0)
})

test('a duplicate submit cannot create a second reservation', async () => {
  const stub = availableStub()
  globalThis.fetch = stub.fetch

  const first = response()
  await handler(bookRequest(details(), '203.0.113.33'), first)
  assert.equal(first.statusCode, 201)

  const second = response()
  await handler(bookRequest(details(), '203.0.113.33'), second)
  assert.equal(second.statusCode, 409)
  assert.equal(second.payload.error, 'duplicate_request')

  const creates = stub.calls.filter((call) => call.url.includes('/v2/bookings'))
  assert.equal(creates.length, 1)
})

test('a provider conflict is surfaced as a taken slot, not a fake success', async () => {
  const stub = availableStub({ createStatus: 409 })
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(bookRequest(details(), '203.0.113.34'), res)

  assert.equal(res.statusCode, 409)
  assert.equal(res.payload.error, 'slot_taken')
  assert.equal(res.payload.booking, undefined)
})

test('a honeypot submission creates nothing', async () => {
  const stub = routerFetch([])
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(bookRequest(details({ website: 'https://spam.example' }), '203.0.113.35'), res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.payload.booking, null)
  assert.equal(stub.calls.length, 0)
})

test('without a Cal.com key the endpoint refuses rather than inventing a booking', async () => {
  delete process.env.CAL_API_KEY
  globalThis.fetch = routerFetch([]).fetch

  const res = response()
  await handler(bookRequest(details(), '203.0.113.36'), res)

  assert.equal(res.statusCode, 503)
  assert.equal(res.payload.error, 'calendar_not_configured')
})
