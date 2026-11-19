import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import cancelHandler from './cancel.js'
import manageHandler from './manage.js'
import rescheduleHandler from './reschedule.js'
import { signCapability } from '../lib/schedulingServer.js'
import { CAL_BOOKING, futureIso, jsonResponse, request, response, routerFetch } from './testHelpers.js'

const START = futureIso(26)
const NEW_START = futureIso(50)
const UID = 'uid_manage_test'
const EMAIL = 'amina@example.com'

let realFetch

beforeEach(() => {
  realFetch = globalThis.fetch
  process.env.CAL_API_KEY = 'test-cal-key'
  process.env.CAL_EVENT_TYPE_ID = '7982708'
  process.env.SCHEDULE_TOKEN_SECRET = 'test-token-secret'
  process.env.RESEND_API_KEY = 'test-resend-key'
  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS = 'false'
})

afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.CAL_API_KEY
  delete process.env.CAL_EVENT_TYPE_ID
  delete process.env.SCHEDULE_TOKEN_SECRET
  delete process.env.RESEND_API_KEY
  delete process.env.SCHEDULE_SEND_ATTENDEE_EMAILS
})

const token = (uid = UID, email = EMAIL) => signCapability({ uid, email })

test('manage reads a real booking only with a valid signed token', async () => {
  const stub = routerFetch([
    {
      pattern: /\/v2\/bookings\//,
      handle: () => jsonResponse({ status: 'success', data: CAL_BOOKING(START) }),
    },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await manageHandler(
    request({ url: `/api/schedule/manage?token=${encodeURIComponent(token())}`, ip: '203.0.113.40' }),
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.equal(res.payload.booking.uid, CAL_BOOKING(START).uid)
  assert.equal(res.payload.booking.email, EMAIL)
  assert.equal(res.payload.canCancel, true)
  assert.equal(res.payload.canReschedule, true)
})

test('a tampered or mismatched token cannot read, cancel or reschedule another booking', async () => {
  const stub = routerFetch([
    {
      pattern: /\/v2\/bookings\/[^/]+$/,
      handle: () => jsonResponse({ status: 'success', data: CAL_BOOKING(START) }),
    },
  ])
  globalThis.fetch = stub.fetch

  const manage = response()
  await manageHandler(
    request({ url: '/api/schedule/manage?token=not.a.token', ip: '203.0.113.41' }),
    manage,
  )
  assert.equal(manage.statusCode, 401)

  const cancel = response()
  await cancelHandler(
    request({
      method: 'POST',
      body: { token: token(UID, 'someone-else@example.com'), uid: UID },
      ip: '203.0.113.42',
    }),
    cancel,
  )
  assert.equal(cancel.statusCode, 401)
  assert.equal(cancel.payload.error, 'invalid_link')

  const move = response()
  await rescheduleHandler(
    request({
      method: 'POST',
      body: {
        token: token(UID, 'someone-else@example.com'),
        uid: UID,
        start: NEW_START,
        timeZone: 'Asia/Kabul',
      },
      ip: '203.0.113.47',
    }),
    move,
  )
  assert.equal(move.statusCode, 401)

  assert.equal(stub.calls.length, 2, 'only the two read-before-mutation checks may call Cal.com')
  assert.equal(stub.calls.some((entry) => /\/cancel|\/reschedule|\/slots/.test(entry.url)), false)
})

test('a booked attendee cannot be swapped by changing the email in the provider response', async () => {
  const wrongAttendee = CAL_BOOKING(START)
  wrongAttendee.attendees[0].email = 'other@example.com'
  const stub = routerFetch([
    { pattern: /\/v2\/bookings\//, handle: () => jsonResponse({ status: 'success', data: wrongAttendee }) },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await manageHandler(
    request({ url: `/api/schedule/manage?token=${encodeURIComponent(token())}`, ip: '203.0.113.43' }),
    res,
  )
  assert.equal(res.statusCode, 401)
  assert.equal(res.payload.error, 'invalid_link')
})

test('cancel calls the real provider endpoint and sends nothing to the guest by default', async () => {
  const stub = routerFetch([
    {
      pattern: /\/v2\/bookings\/[^/]+$/,
      handle: () => jsonResponse({ status: 'success', data: CAL_BOOKING(START) }),
    },
    {
      pattern: /\/v2\/bookings\/[^/]+\/cancel/,
      handle: () => {
        const booking = CAL_BOOKING(START)
        booking.status = 'cancelled'
        return jsonResponse({ status: 'success', data: booking })
      },
    },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await cancelHandler(
    request({
      method: 'POST',
      body: { token: token(), uid: UID, reason: 'Schedule changed' },
      ip: '203.0.113.44',
    }),
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.equal(res.payload.booking.status, 'cancelled')
  assert.equal(res.payload.emailsSent, null)
  const call = stub.calls.find((entry) => entry.url.includes('/cancel'))
  assert.ok(call)
  assert.equal(call.init.method, 'POST')
  assert.equal(call.body.cancellationReason, 'Schedule changed')
  assert.equal(stub.calls.some((entry) => entry.url.includes('api.resend.com')), false)
})

test('reschedule re-checks the new slot before moving a real booking', async () => {
  const next = CAL_BOOKING(NEW_START)
  const stub = routerFetch([
    {
      pattern: /\/v2\/bookings\/[^/]+$/,
      handle: () => jsonResponse({ status: 'success', data: CAL_BOOKING(START) }),
    },
    {
      pattern: /\/v2\/slots/,
      handle: () => jsonResponse({ status: 'success', data: { [NEW_START.slice(0, 10)]: [{ start: NEW_START }] } }),
    },
    {
      pattern: /\/v2\/bookings\/[^/]+\/reschedule/,
      handle: () => jsonResponse({ status: 'success', data: next }, 201),
    },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await rescheduleHandler(
    request({
      method: 'POST',
      body: { token: token(), uid: UID, start: NEW_START, timeZone: 'Asia/Kabul' },
      ip: '203.0.113.45',
    }),
    res,
  )

  assert.equal(res.statusCode, 200)
  assert.equal(res.payload.booking.start, NEW_START)
  assert.match(res.payload.manageToken, /\./)
  assert.equal(res.payload.emailsSent, null)

  const slots = stub.calls.find((entry) => entry.url.includes('/v2/slots'))
  assert.equal(new URL(slots.url).searchParams.get('bookingUidToReschedule'), UID)
  const move = stub.calls.find((entry) => entry.url.includes('/reschedule'))
  assert.equal(move.body.start, NEW_START)
  assert.equal(move.body.allowConflicts, undefined)
})

test('reschedule refuses a slot that Cal.com no longer offers', async () => {
  const stub = routerFetch([
    {
      pattern: /\/v2\/bookings\/[^/]+$/,
      handle: () => jsonResponse({ status: 'success', data: CAL_BOOKING(START) }),
    },
    { pattern: /\/v2\/slots/, handle: () => jsonResponse({ status: 'success', data: {} }) },
  ])
  globalThis.fetch = stub.fetch

  const res = response()
  await rescheduleHandler(
    request({
      method: 'POST',
      body: { token: token(), uid: UID, start: NEW_START, timeZone: 'Asia/Kabul' },
      ip: '203.0.113.46',
    }),
    res,
  )

  assert.equal(res.statusCode, 409)
  assert.equal(res.payload.error, 'slot_taken')
  assert.equal(stub.calls.length, 2)
  assert.equal(stub.calls.some((entry) => entry.url.includes('/reschedule')), false)
})
