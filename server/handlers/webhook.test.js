import { createHmac } from 'node:crypto'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import handler from './webhook.js'
import { futureIso, jsonResponse, request, response, routerFetch } from './testHelpers.js'

const SECRET = 'test-webhook-secret'
let realFetch

beforeEach(() => {
  realFetch = globalThis.fetch
  process.env.CAL_WEBHOOK_SECRET = SECRET
  process.env.RESEND_API_KEY = 'test-resend-key'
  process.env.SCHEDULE_TOKEN_SECRET = 'test-token-secret'
  process.env.CONTACT_TO_EMAIL = 'company@example.com'
  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS = 'false'
})

afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.CAL_WEBHOOK_SECRET
  delete process.env.RESEND_API_KEY
  delete process.env.SCHEDULE_TOKEN_SECRET
  delete process.env.CONTACT_TO_EMAIL
  delete process.env.SCHEDULE_SEND_ATTENDEE_EMAILS
})

function payload(uid, extra = {}) {
  const start = futureIso(26)
  return {
    triggerEvent: 'BOOKING_CREATED',
    payload: {
      uid,
      title: 'Meeting',
      status: 'accepted',
      start,
      end: new Date(Date.parse(start) + 1_800_000).toISOString(),
      attendees: [{ name: 'Guest', email: 'guest@example.com', timeZone: 'Asia/Kabul' }],
      ...extra,
    },
  }
}

function webhookRequest(event, { signature } = {}) {
  const raw = JSON.stringify(event)
  const valid = createHmac('sha256', SECRET).update(raw).digest('hex')
  return request({
    method: 'POST',
    body: raw,
    headers: { 'x-cal-signature-256': signature === undefined ? valid : signature },
    url: '/api/schedule/webhook',
  })
}

test('an invalid signature is rejected before parsing or emailing', async () => {
  const stub = routerFetch([])
  globalThis.fetch = stub.fetch

  const res = response()
  await handler(webhookRequest(payload('uid_bad_signature'), { signature: 'deadbeef' }), res)

  assert.equal(res.statusCode, 401)
  assert.equal(res.payload.error, 'invalid_signature')
  assert.equal(stub.calls.length, 0)
})

test('bookings made by this website are skipped to avoid duplicate branded mail', async () => {
  const stub = routerFetch([])
  globalThis.fetch = stub.fetch

  const event = payload('uid_website_source', {
    metadata: { source: 'website' },
  })
  const res = response()
  await handler(webhookRequest(event), res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.payload.skipped, 'handled_by_website')
  assert.equal(stub.calls.length, 0)
})

test('a verified external booking notifies the company once and never emails the guest twice', async () => {
  const stub = routerFetch([
    {
      pattern: /api\.resend\.com\/emails/,
      handle: (_url, _init, calls) => jsonResponse({ id: `resend_${calls.length}` }, 201),
    },
  ])
  globalThis.fetch = stub.fetch

  const event = payload('uid_external_booking')
  const first = response()
  await handler(webhookRequest(event), first)
  assert.equal(first.statusCode, 200)
  assert.equal(first.payload.ok, true)

  const mails = stub.calls.filter((call) => call.url.includes('api.resend.com'))
  assert.equal(mails.length, 1)
  assert.equal(mails[0].body.to, 'company@example.com')
  assert.match(mails[0].body.subject, /New meeting booked/)
  assert.match(mails[0].body.text, /afghanfutian\.com\/schedule\/manage\?token=/)
})

test('a failed email dispatch is not deduplicated, so a retry can succeed', async () => {
  const stub = routerFetch([
    {
      pattern: /api\.resend\.com\/emails/,
      handle: (_url, _init, calls) =>
        calls.length === 1
          ? jsonResponse({ name: 'temporary_error' }, 500)
          : jsonResponse({ id: 'resend_retry' }, 201),
    },
  ])
  globalThis.fetch = stub.fetch

  const event = payload('uid_retry_after_failure')
  const first = response()
  await handler(webhookRequest(event), first)
  assert.equal(first.statusCode, 500)

  const retry = response()
  await handler(webhookRequest(event), retry)
  assert.equal(retry.statusCode, 200)
  assert.equal(retry.payload.duplicate, undefined)

  const mails = stub.calls.filter((call) => call.url.includes('api.resend.com'))
  assert.equal(mails.length, 2)
})

test('a repeated webhook delivery is a no-op', async () => {
  const stub = routerFetch([
    {
      pattern: /api\.resend\.com\/emails/,
      handle: (_url, _init, calls) => jsonResponse({ id: `resend_${calls.length}` }, 201),
    },
  ])
  globalThis.fetch = stub.fetch

  const event = payload('uid_duplicate_delivery')

  const first = response()
  await handler(webhookRequest(event), first)
  const second = response()
  await handler(webhookRequest(event), second)

  assert.equal(first.statusCode, 200)
  assert.equal(second.statusCode, 200)
  assert.equal(second.payload.duplicate, true)

  const mails = stub.calls.filter((call) => call.url.includes('api.resend.com'))
  assert.equal(mails.length, 1)
})
