import assert from 'node:assert/strict'
import test from 'node:test'

import { preflight } from '../../src/lib/schedulingServer.js'
import { request, response } from './testHelpers.js'

test('a same-origin preflight gets only the headers the scheduler uses', () => {
  const res = response()
  const req = request({
    method: 'OPTIONS',
    headers: { origin: 'https://afghanfutian.com' },
  })

  assert.equal(preflight(req, res, 'POST, OPTIONS'), true)
  assert.equal(res.statusCode, 204)
  assert.equal(res.headers['access-control-allow-origin'], 'https://afghanfutian.com')
  assert.equal(res.headers['access-control-allow-methods'], 'POST, OPTIONS')
  assert.equal(res.headers['access-control-allow-headers'], 'Content-Type')
  assert.equal(res.headers.vary, 'Origin')
})

test('a preflight from another origin is refused without CORS headers', () => {
  const res = response()
  const req = request({
    method: 'OPTIONS',
    headers: { origin: 'https://attacker.example' },
  })

  assert.equal(preflight(req, res), true)
  assert.equal(res.statusCode, 403)
  assert.equal(res.headers['access-control-allow-origin'], undefined)
})

test('non-OPTIONS requests are left to the endpoint handler', () => {
  const res = response()
  assert.equal(preflight(request({ method: 'GET' }), res), false)
  assert.equal(res.statusCode, 0)
})
