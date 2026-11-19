import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ScheduleApiError,
  cancelBooking,
  createBooking,
  fetchAvailability,
  fetchManage,
  rescheduleBooking,
} from './scheduleApi.js'

const originalFetch = globalThis.fetch

function stubFetch(implementation) {
  globalThis.fetch = implementation
}

function restoreFetch() {
  globalThis.fetch = originalFetch
}

function fakeResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }
}

test('new bookings only call the booking route and never send a management token', async () => {
  const calls = []
  stubFetch(async (url, init) => {
    calls.push({ url, init })
    return fakeResponse(201, {
      ok: true,
      booking: { uid: 'booked', start: '2026-11-21T09:00:00.000Z' },
      manageToken: 'signed.token',
    })
  })

  try {
    const data = await createBooking({
      name: 'Ada',
      email: 'ada@example.com',
      start: '2026-11-21T09:00:00.000Z',
      timeZone: 'Asia/Kabul',
    })

    assert.equal(data.booking.uid, 'booked')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, '/api/schedule/book')
    assert.equal(calls[0].init.method, 'POST')
    const sent = JSON.parse(calls[0].init.body)
    assert.equal(sent.token, undefined)
    assert.equal(sent.timeZone, 'Asia/Kabul')
  } finally {
    restoreFetch()
  }
})

test('a 403 from availability or booking is an origin error, not an expired link', async () => {
  stubFetch(async () => fakeResponse(403, { ok: false, error: 'forbidden' }))

  try {
    for (const call of [
      () => fetchAvailability({ from: '2026-11-19', to: '2026-12-19', timeZone: 'Asia/Kabul' }),
      () =>
        createBooking({
          name: 'Ada',
          email: 'ada@example.com',
          start: '2026-11-21T09:00:00.000Z',
          timeZone: 'Asia/Kabul',
        }),
    ]) {
      await assert.rejects(
        call,
        (error) => {
          assert.ok(error instanceof ScheduleApiError)
          assert.equal(error.kind, 'forbidden')
          assert.doesNotMatch(error.message, /invalid|expired/i)
          return true
        },
      )
    }
  } finally {
    restoreFetch()
  }
})

test('only management endpoints report an invalid or expired link', async () => {
  const calls = []
  stubFetch(async (url, init) => {
    calls.push({ url, init })
    return fakeResponse(401, { ok: false, error: 'invalid_link' })
  })

  try {
    await assert.rejects(fetchManage('expired.token'), {
      name: 'ScheduleApiError',
      kind: 'invalid_link',
    })
    await assert.rejects(
      cancelBooking({ token: 'expired.token', uid: 'booking', reason: '' }),
      { name: 'ScheduleApiError', kind: 'invalid_link' },
    )
    await assert.rejects(
      rescheduleBooking({
        token: 'expired.token',
        uid: 'booking',
        start: '2026-11-21T09:00:00.000Z',
        timeZone: 'Asia/Kabul',
      }),
      { name: 'ScheduleApiError', kind: 'invalid_link' },
    )

    assert.equal(calls[0].url, '/api/schedule/manage?token=expired.token')
    assert.equal(calls[1].url, '/api/schedule/cancel')
    assert.equal(calls[2].url, '/api/schedule/reschedule')
    assert.equal(JSON.parse(calls[2].init.body).token, 'expired.token')
  } finally {
    restoreFetch()
  }
})
