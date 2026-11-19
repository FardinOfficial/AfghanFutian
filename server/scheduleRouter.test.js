import assert from 'node:assert/strict'
import test from 'node:test'

import scheduleEntry from '../api/schedule.js'
import webhookEntry from '../api/webhook.js'
import { request, response } from './handlers/testHelpers.js'
import {
  createScheduleRouter,
  resolveScheduleRoute,
  SCHEDULE_ROUTES,
  scheduleHandler,
} from './scheduleRouter.js'

const ROUTE_NAMES = [
  'availability',
  'book',
  'manage',
  'cancel',
  'reschedule',
  'reminder',
]

test('api entry points export callable handlers', () => {
  assert.equal(typeof scheduleEntry, 'function')
  assert.equal(typeof scheduleEntry, typeof scheduleHandler)
  assert.equal(typeof webhookEntry, 'function')
})

test('both rewrite-style and direct-style URLs resolve to the same route', () => {
  for (const name of ROUTE_NAMES) {
    assert.equal(resolveScheduleRoute(request({ url: `/api/schedule?route=${name}` })), name)
    assert.equal(
      resolveScheduleRoute(request({ url: `/api/schedule/__unused?__route=${name}` })),
      name,
    )
    assert.equal(resolveScheduleRoute(request({ url: `/api/schedule/${name}?from=2026-01-01` })), name)
    assert.equal(resolveScheduleRoute(request({ url: `/api/schedule/${name}/` })), name)
  }

  const rewritten = request({ url: '/api/schedule?from=2026-01-01' })
  rewritten.query = { route: 'availability' }
  assert.equal(resolveScheduleRoute(rewritten), 'availability')

  assert.equal(resolveScheduleRoute(request({ url: '/api/schedule' })), null)
  assert.equal(resolveScheduleRoute(request({ url: '/api/schedule/not-a-route' })), null)
})

test('the router delegates every preserved endpoint exactly once', async () => {
  const calls = []
  const routes = Object.fromEntries(
    Object.keys(SCHEDULE_ROUTES).map((name) => [
      name,
      async (req, res) => {
        calls.push({ name, req, res })
      },
    ]),
  )
  const route = createScheduleRouter(routes)

  for (const name of ROUTE_NAMES) {
    const req = request({ url: `/api/schedule?route=${name}` })
    const res = response()
    await route(req, res)
  }

  assert.deepEqual(
    calls.map((call) => call.name),
    ROUTE_NAMES,
  )
  assert.ok(calls.every((call) => call.req && call.res))
})

test('an unknown route returns 404 without calling another handler', async () => {
  let called = false
  const route = createScheduleRouter({
    availability: async () => {
      called = true
    },
  })
  const res = response()

  await route(request({ url: '/api/schedule?route=unknown' }), res)

  assert.equal(called, false)
  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.payload, { ok: false, error: 'not_found' })
})
