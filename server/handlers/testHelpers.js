/** Small fakes shared by the scheduling endpoint tests. Not a production module. */

export function request({ method = 'GET', body, headers = {}, ip = '203.0.113.10', url = '/' } = {}) {
  return {
    method,
    url,
    body,
    headers: { 'x-forwarded-for': ip, ...headers },
    socket: { remoteAddress: ip },
  }
}

export function response() {
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

export function futureIso(hours = 26) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

export const CAL_BOOKING = (start) => ({
  uid: 'booking_uid_123456',
  title: 'Afghan Futian Trading Company — Meeting',
  status: 'accepted',
  start,
  end: new Date(Date.parse(start) + 30 * 60_000).toISOString(),
  duration: 30,
  location: 'https://meet.google.com/abc-defg-hij',
  attendees: [
    {
      name: 'Amina Rahimi',
      email: 'amina@example.com',
      timeZone: 'Asia/Kabul',
    },
  ],
  bookingFieldsResponses: { company: 'Rahimi Trading', purpose: 'Discuss a sourcing requirement' },
  metadata: { source: 'website' },
})

/** A `fetch` implementation that routes by URL and records every call. */
export function routerFetch(routes) {
  const calls = []
  return {
    calls,
    fetch: async (url, init = {}) => {
      const target = String(url)
      calls.push({ url: target, init, body: init.body ? JSON.parse(init.body) : undefined })
      const match = routes.find((route) => route.pattern.test(target))
      if (!match) throw new Error(`Unexpected fetch to ${target}`)
      return match.handle(target, init, calls)
    },
  }
}

export function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}
