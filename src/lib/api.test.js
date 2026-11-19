import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildContactPayload,
  CONTACT_ENDPOINT,
  ContactSubmitError,
  HONEYPOT_FIELD,
  submitContactForm,
} from './api.js'

/**
 * Unit tests for the submission layer.
 *
 * `api.js` deliberately imports nothing, so it loads in plain Node: with no
 * `VITE_API_BASE_URL` set, `import.meta.env` is undefined and the endpoint
 * resolves to the site's own origin. `fetch` is stubbed per test, and the
 * timeout is cleared on every path, so no test leaves a timer behind.
 */

/** Replace `globalThis.fetch` for the duration of one test. Returns a restore fn. */
function stubFetch(implementation) {
  const original = globalThis.fetch
  globalThis.fetch = implementation
  return () => {
    globalThis.fetch = original
  }
}

const json = (body, status = 201) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('configuration', () => {
  it('posts to the site’s own origin when VITE_API_BASE_URL is unset', () => {
    assert.equal(CONTACT_ENDPOINT, '/api/contact')
  })

  it('names the honeypot field the server should ignore', () => {
    assert.equal(HONEYPOT_FIELD, 'website')
  })
})

describe('buildContactPayload', () => {
  it('trims every value and defaults missing fields to an empty string', () => {
    const payload = buildContactPayload({ name: '  Amina  ', message: '  Hi  ' })

    assert.equal(payload.name, 'Amina')
    assert.equal(payload.message, 'Hi')
    assert.equal(payload.company, '')
    assert.equal(payload.phone, '')
    assert.equal(payload.country, '')
    assert.equal(payload.service, '')
  })

  it('carries exactly the fields the documented contract promises', () => {
    const payload = buildContactPayload({})

    assert.deepEqual(Object.keys(payload).sort(), [
      'company',
      'country',
      'email',
      'message',
      'meta',
      'name',
      'phone',
      'service',
      'website',
    ])
  })

  it('stamps a round-trippable submission time', () => {
    const { meta } = buildContactPayload({})

    assert.equal(Number.isNaN(Date.parse(meta.submittedAt)), false)
    assert.equal(meta.submittedAt, new Date(meta.submittedAt).toISOString())
  })

  it('sends the start time separately from the submission time', () => {
    const startedAt = Date.now() - 30_000
    const { meta } = buildContactPayload({}, { startedAt })

    assert.equal(meta.startedAt, new Date(startedAt).toISOString())
    assert.ok(Date.parse(meta.submittedAt) - Date.parse(meta.startedAt) >= 30_000)
  })

  it('omits an unknown start time so the server can skip its timing guard', () => {
    const { meta } = buildContactPayload({}, { startedAt: null })
    const wire = JSON.parse(JSON.stringify(meta))

    assert.ok(!('startedAt' in wire), 'undefined must not become a JSON field')
  })

  it('includes the honeypot value so the server can make the decision', () => {
    assert.equal(buildContactPayload({}).website, '')
    assert.equal(buildContactPayload({}, { honeypot: 'http://spam.example' }).website, 'http://spam.example')
  })

  it('builds a JSON-serialisable payload outside a browser', () => {
    const payload = buildContactPayload({ name: 'Amina' })
    const roundTripped = JSON.parse(JSON.stringify(payload))

    assert.equal(roundTripped.name, 'Amina')
    assert.equal(typeof roundTripped.meta.submittedAt, 'string')

    // There is no `window` here, so no page path is claimed. `JSON.stringify`
    // drops undefined values, which is exactly what the wire format does.
    assert.equal(payload.meta.path, undefined)
    assert.ok(!('path' in roundTripped))
  })
})

describe('submitContactForm', () => {
  it('sends a JSON POST to the endpoint and returns the server id', async () => {
    let captured

    const restore = stubFetch(async (url, init) => {
      captured = { url, init }
      return json({ ok: true, id: '507f1f77bcf86cd799439011' })
    })

    try {
      const result = await submitContactForm({ name: '  Amina  ', email: 'amina@example.com' })

      assert.deepEqual(result, { id: '507f1f77bcf86cd799439011' })
      assert.equal(captured.url, '/api/contact')
      assert.equal(captured.init.method, 'POST')
      assert.equal(captured.init.headers['Content-Type'], 'application/json')
      assert.equal(captured.init.headers.Accept, 'application/json')
      assert.equal(JSON.parse(captured.init.body).name, 'Amina')
    } finally {
      restore()
    }
  })

  /*
   * Regression: the production outage. The server returns 201 `{ok:true,
   * id:null}` for silent bot drops. Treating that as success is exactly why
   * visitors saw "Enquiry received" while nothing was sent.
   */
  it('rejects a 201 with no provider id instead of claiming success', async () => {
    const restore = stubFetch(async () => json({ ok: true }))

    try {
      await assert.rejects(submitContactForm({}), (error) => {
        assert.equal(error.kind, 'server')
        assert.match(error.message, /could not confirm/)
        return true
      })
    } finally {
      restore()
    }
  })

  it('accepts an id-bearing 201, including a duplicate of an already sent enquiry', async () => {
    const restore = stubFetch(async () => json({ ok: true, id: 'resend_42', duplicate: true }))

    try {
      assert.deepEqual(await submitContactForm({}), { id: 'resend_42' })
    } finally {
      restore()
    }
  })

  it('forwards the honeypot and start time in the request body', async () => {
    let sent
    const restore = stubFetch(async (url, init) => {
      sent = JSON.parse(init.body)
      return json({ ok: true, id: 'resend_43' })
    })

    try {
      await submitContactForm({}, { honeypot: 'filled', startedAt: 1_000 })
      assert.equal(sent.website, 'filled')
      assert.equal(sent.meta.startedAt, new Date(1_000).toISOString())
    } finally {
      restore()
    }
  })

  it('surfaces server-side field errors as a validation failure', async () => {
    const restore = stubFetch(async () =>
      json({ ok: false, errors: { email: 'That address is not valid.' } }, 400),
    )

    try {
      await assert.rejects(submitContactForm({}), (error) => {
        assert.ok(error instanceof ContactSubmitError)
        assert.equal(error.kind, 'validation')
        assert.deepEqual(error.fieldErrors, { email: 'That address is not valid.' })
        return true
      })
    } finally {
      restore()
    }
  })

  it('reports rate limiting distinctly from a validation failure', async () => {
    const restore = stubFetch(async () => json({ ok: false, errors: { message: 'Slow down.' } }, 429))

    try {
      await assert.rejects(submitContactForm({}), (error) => {
        assert.equal(error.kind, 'rate-limited')
        return true
      })
    } finally {
      restore()
    }
  })

  it('treats any 5xx as a generic server failure, even without a JSON body', async () => {
    const restore = stubFetch(async () => new Response('<html>Bad gateway</html>', { status: 502 }))

    try {
      await assert.rejects(submitContactForm({}), (error) => {
        assert.equal(error.kind, 'server')
        assert.equal(error.fieldErrors, null)
        return true
      })
    } finally {
      restore()
    }
  })

  it('distinguishes a network failure from a timeout', async () => {
    const restoreNetwork = stubFetch(async () => {
      throw new TypeError('fetch failed')
    })

    try {
      await assert.rejects(submitContactForm({}), (error) => {
        assert.equal(error.kind, 'network')
        return true
      })
    } finally {
      restoreNetwork()
    }

    const restoreAbort = stubFetch(async () => {
      throw Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })
    })

    try {
      await assert.rejects(submitContactForm({}), (error) => {
        assert.equal(error.kind, 'timeout')
        return true
      })
    } finally {
      restoreAbort()
    }
  })

  it('always attaches a human-readable message and a kind', async () => {
    const restore = stubFetch(async () => json({ ok: false }, 500))

    try {
      await assert.rejects(submitContactForm({}), (error) => {
        assert.equal(typeof error.message, 'string')
        assert.ok(error.message.length > 0)
        assert.equal(typeof error.kind, 'string')
        return true
      })
    } finally {
      restore()
    }
  })
})

describe('ContactSubmitError', () => {
  it('carries the kind and the field errors', () => {
    const error = new ContactSubmitError('validation', 'Nope.', { email: 'Bad.' })

    assert.ok(error instanceof Error)
    assert.equal(error.name, 'ContactSubmitError')
    assert.equal(error.kind, 'validation')
    assert.equal(error.message, 'Nope.')
    assert.deepEqual(error.fieldErrors, { email: 'Bad.' })
  })

  it('defaults field errors to null', () => {
    assert.equal(new ContactSubmitError('network', 'Down.').fieldErrors, null)
  })
})
