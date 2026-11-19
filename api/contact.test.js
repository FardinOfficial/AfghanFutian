import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import handler from './contact.js'

/**
 * Tests for the enquiry endpoint.
 * ============================================================================
 * `api/contact.js` is the only server-side code in the project, and the only
 * place where a mistake sends an email that should not have gone out — or fails
 * to send one that should have. So it is tested directly, with no HTTP server:
 * the function takes a Node request and response, and a fake pair is enough to
 * drive it.
 *
 * `fetch` is stubbed, so nothing is ever sent to Resend. That is the whole point
 * — these tests prove the payloads, the guards and the status codes are right
 * without needing a Resend account.
 *
 * Note on ordering: the handler keeps its rate-limit and de-duplication state in
 * module-scope maps, which persist for the life of this process. Each test that
 * submits therefore uses a **fresh client address**, so no test can be affected
 * by another's submissions.
 */

/* --------------------------------------------------------------------------
   A stand-in for Resend
   -------------------------------------------------------------------------- */

/** Every request the handler made, in order. */
let calls = []

/** Swapped per test to make the stub fail. */
let reply = () => ({ ok: true, status: 200, body: { id: `resend_${calls.length}` } })

globalThis.fetch = async (url, init) => {
  calls.push({ url, headers: init.headers, body: JSON.parse(init.body) })
  const { ok, status, body } = reply()
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

/* --------------------------------------------------------------------------
   Fakes for the request and response
   -------------------------------------------------------------------------- */

function request({ method = 'POST', body = {}, ip = '203.0.113.9' } = {}) {
  return {
    method,
    body,
    headers: { 'x-forwarded-for': ip, 'user-agent': 'afghan-futian-tests/1.0' },
    socket: { remoteAddress: ip },
  }
}

function response() {
  return {
    statusCode: 0,
    headers: {},
    payload: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value
    },
    end(chunk) {
      this.payload = chunk ? JSON.parse(chunk) : null
    },
  }
}

/* --------------------------------------------------------------------------
   Enquiry fixtures
   -------------------------------------------------------------------------- */

let sequence = 0

/**
 * A complete, valid enquiry. The message carries a counter so that no two
 * enquiries are identical — otherwise the handler's de-duplication would treat
 * a later test's submission as a repeat of an earlier one.
 */
function enquiry(overrides = {}) {
  sequence += 1
  return {
    name: 'Amina Rahimi',
    email: 'amina@example.com',
    company: 'Rahimi Trading',
    phone: '+93 700 000 000',
    country: 'Afghanistan',
    service: 'Global Sourcing',
    message: `Enquiry ${sequence}: we would like to source 4,000 units of stainless steel kitchenware for spring delivery.`,
    meta: {
      submittedAt: new Date(Date.now() - 60_000).toISOString(),
      locale: 'en-GB',
      path: '/contact',
    },
    ...overrides,
  }
}

/** A client address no other test has used. */
let clientNumber = 0
function freshClient() {
  clientNumber += 1
  return `198.51.100.${clientNumber}`
}

/* --------------------------------------------------------------------------
   Isolation
   -------------------------------------------------------------------------- */

const ENV_KEYS = [
  'RESEND_API_KEY',
  'CONTACT_TO_EMAIL',
  'CONTACT_FROM_EMAIL',
  'CONTACT_ALLOWED_ORIGIN',
]

beforeEach(() => {
  calls = []
  reply = () => ({ ok: true, status: 200, body: { id: `resend_${calls.length}` } })
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key]
})

/* --------------------------------------------------------------------------
   Configuration
   -------------------------------------------------------------------------- */

test('refuses to pretend when the mail service is not configured', async (t) => {
  t.mock.method(console, 'error', () => {})

  const res = response()
  await handler(request({ body: enquiry() }), res)

  assert.equal(res.statusCode, 503)
  assert.equal(res.payload.ok, false)
  assert.equal(calls.length, 0, 'nothing may be sent without an API key')
})

/* --------------------------------------------------------------------------
   Method and preflight
   -------------------------------------------------------------------------- */

test('accepts only POST', async () => {
  process.env.RESEND_API_KEY = 'test-key'

  const res = response()
  await handler(request({ method: 'GET' }), res)

  assert.equal(res.statusCode, 405)
  assert.equal(res.headers.allow, 'POST, OPTIONS')
  assert.equal(calls.length, 0)
})

test('answers a CORS preflight without touching the mail service', async () => {
  process.env.RESEND_API_KEY = 'test-key'

  const res = response()
  await handler(request({ method: 'OPTIONS' }), res)

  assert.equal(res.statusCode, 204)
  assert.equal(calls.length, 0)
})

/* --------------------------------------------------------------------------
   Silent bot guards
   -------------------------------------------------------------------------- */

test('accepts honeypot traffic silently and sends nothing', async () => {
  process.env.RESEND_API_KEY = 'test-key'

  const res = response()
  await handler(request({ body: enquiry({ website: 'http://spam.example' }) }), res)

  // Success is deliberate: a bot told it failed simply tries again.
  assert.equal(res.statusCode, 201)
  assert.equal(res.payload.id, null)
  assert.equal(calls.length, 0)
})

test('drops a form completed faster than a person could type', async () => {
  process.env.RESEND_API_KEY = 'test-key'

  const res = response()
  await handler(
    request({ body: enquiry({ meta: { submittedAt: new Date().toISOString() } }) }),
    res,
  )

  assert.equal(res.statusCode, 201)
  assert.equal(res.payload.id, null)
  assert.equal(calls.length, 0)
})

/* --------------------------------------------------------------------------
   Validation
   -------------------------------------------------------------------------- */

test('reports every invalid field, using the browser’s own rules', async () => {
  process.env.RESEND_API_KEY = 'test-key'

  const res = response()
  await handler(request({ body: { name: 'A', email: 'not-an-address' } }), res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.payload.ok, false)
  assert.ok(res.payload.errors.name)
  assert.ok(res.payload.errors.email)
  assert.ok(res.payload.errors.message, 'a missing required field is reported too')
  assert.equal(calls.length, 0)
})

/* --------------------------------------------------------------------------
   The happy path
   -------------------------------------------------------------------------- */

test('sends a notification to the company and a confirmation to the visitor', async () => {
  process.env.RESEND_API_KEY = 'test-key'

  const res = response()
  await handler(request({ body: enquiry() }), res)

  assert.equal(res.statusCode, 201)
  assert.equal(res.payload.ok, true)
  assert.equal(res.payload.id, 'resend_1', 'the provider’s id is passed back')
  assert.equal(calls.length, 2, 'exactly two emails')

  const [notify, confirm] = calls

  assert.equal(notify.url, 'https://api.resend.com/emails')
  assert.equal(notify.headers.Authorization, 'Bearer test-key')
  assert.deepEqual(notify.body.to, ['contact@afghanfutian.com'])
  assert.equal(notify.body.reply_to, 'amina@example.com', 'reply goes to the visitor')
  assert.match(notify.body.subject, /Global Sourcing/)
  assert.match(notify.body.text, /Amina Rahimi/)

  assert.deepEqual(confirm.body.to, ['amina@example.com'])
  assert.equal(confirm.body.reply_to, 'contact@afghanfutian.com')
})

test('honours CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL', async () => {
  process.env.RESEND_API_KEY = 'test-key'
  process.env.CONTACT_TO_EMAIL = 'inbox@example.org'
  process.env.CONTACT_FROM_EMAIL = 'Website <no-reply@example.org>'

  const res = response()
  await handler(request({ body: enquiry() }), res)

  assert.equal(res.statusCode, 201)
  assert.deepEqual(calls[0].body.to, ['inbox@example.org'])
  assert.equal(calls[0].body.from, 'Website <no-reply@example.org>')
})

/* --------------------------------------------------------------------------
   Abuse guards
   -------------------------------------------------------------------------- */

test('does not send the same enquiry twice', async () => {
  process.env.RESEND_API_KEY = 'test-key'

  const body = enquiry()
  const ip = freshClient()

  const first = response()
  await handler(request({ body, ip }), first)
  assert.equal(first.statusCode, 201)
  assert.equal(first.payload.duplicate, undefined)
  assert.equal(calls.length, 2)

  const second = response()
  await handler(request({ body, ip }), second)
  assert.equal(second.statusCode, 201)
  assert.equal(second.payload.duplicate, true)
  assert.equal(calls.length, 2, 'the repeat must not be sent again')
})

test('rate-limits a client that submits too often', async () => {
  process.env.RESEND_API_KEY = 'test-key'
  const ip = freshClient()

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const res = response()
    await handler(request({ body: enquiry(), ip }), res)
    assert.equal(res.statusCode, 201, `attempt ${attempt} should be accepted`)
  }

  const blocked = response()
  await handler(request({ body: enquiry(), ip }), blocked)
  assert.equal(blocked.statusCode, 429)
  assert.equal(blocked.payload.ok, false)
})

/* --------------------------------------------------------------------------
   Failure honesty
   -------------------------------------------------------------------------- */

test('reports a refused send as 502, never as a false success', async (t) => {
  t.mock.method(console, 'error', () => {})
  process.env.RESEND_API_KEY = 'test-key'
  reply = () => ({ ok: false, status: 422, body: { message: 'domain not verified' } })

  const res = response()
  await handler(request({ body: enquiry(), ip: freshClient() }), res)

  assert.equal(res.statusCode, 502)
  assert.equal(res.payload.ok, false)
})
