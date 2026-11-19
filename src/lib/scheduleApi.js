/**
 * SCHEDULING CLIENT
 * ============================================================================
 * The browser half of the native booker. It only ever talks to our own Vercel
 * Functions on the same origin — the Cal.com API key and webhook secret stay
 * server-side and are never present in this bundle.
 *
 * Every failure is normalised into a `ScheduleApiError` with a stable `kind`,
 * so the UI can react to expired slots, provider outages and duplicates without
 * parsing strings.
 */

const RAW_BASE = import.meta.env?.VITE_API_BASE_URL ?? ''
const API_BASE = RAW_BASE.replace(/\/+$/, '')
const ROOT = `${API_BASE}/api/schedule`
const TIMEOUT_MS = 15000

export class ScheduleApiError extends Error {
  constructor(kind, message, fieldErrors = null) {
    super(message)
    this.name = 'ScheduleApiError'
    this.kind = kind
    this.fieldErrors = fieldErrors
  }
}

async function request(path, { method = 'GET', body, signal, auth = 'none' } = {}) {
  let response
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })

  try {
    response = await fetch(`${ROOT}${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ScheduleApiError('timeout', 'The request took too long. Please try again.')
    }
    throw new ScheduleApiError('network', 'We could not reach the server. Please check your connection.')
  } finally {
    clearTimeout(timer)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (response.ok) {
    if (data?.ok !== true) {
      throw new ScheduleApiError('server', 'The server returned an unexpected response.')
    }
    return data
  }

  if (response.status === 400) {
    throw new ScheduleApiError('validation', 'Some details need another look.', data?.errors ?? null)
  }
  if (response.status === 401 || response.status === 403) {
    // Only management endpoints use a signed capability token. Every 401/403
    // used to be reported as an expired link, so a same-origin rejection from
    // availability or booking produced the mismatched "invalid link" message
    // during an ordinary new booking. Keep those failures distinct.
    if (auth === 'manage' || data?.error === 'invalid_link') {
      throw new ScheduleApiError('invalid_link', 'This management link is invalid or has expired.')
    }
    throw new ScheduleApiError(
      'forbidden',
      'The site could not verify this request. Reload the page and try again, or email us directly.',
    )
  }
  if (response.status === 409) {
    if (data?.error === 'slot_taken') {
      throw new ScheduleApiError('slot_taken', 'That time has just been taken. Please choose another.')
    }
    throw new ScheduleApiError('duplicate', 'We already received that request. Check your email before trying again.')
  }
  if (response.status === 410) {
    throw new ScheduleApiError('slot_expired', 'That time is no longer available. Please choose another.')
  }
  if (response.status === 429) {
    throw new ScheduleApiError('rate-limited', 'Too many attempts. Please wait a moment and try again.')
  }
  if (response.status === 503) {
    throw new ScheduleApiError('unavailable', 'Booking is temporarily unavailable. Please try again shortly.')
  }
  throw new ScheduleApiError('server', 'Something went wrong at our end. Please try again.')
}

export function fetchAvailability({ from, to, timeZone, rescheduleUid }, options = {}) {
  const query = new URLSearchParams({ from, to, timeZone })
  if (rescheduleUid) query.set('rescheduleUid', rescheduleUid)
  return request(`/availability?${query.toString()}`, options)
}

export function createBooking(payload, options = {}) {
  return request('/book', { method: 'POST', body: payload, ...options })
}

export function fetchManage(token, options = {}) {
  return request(`/manage?token=${encodeURIComponent(token)}`, { ...options, auth: 'manage' })
}

export function cancelBooking({ token, uid, reason }, options = {}) {
  return request('/cancel', {
    method: 'POST',
    body: { token, uid, reason },
    ...options,
    auth: 'manage',
  })
}

export function rescheduleBooking({ token, uid, start, timeZone }, options = {}) {
  return request('/reschedule', {
    method: 'POST',
    body: { token, uid, start, timeZone },
    ...options,
    auth: 'manage',
  })
}

/** Human-readable messages for the stable error kinds the API can return. */
export const SCHEDULE_ERROR_COPY = {
  slot_taken: 'That time was just booked by somebody else. Pick another and we will try again.',
  slot_expired: 'That time is no longer available because of the minimum notice period.',
  duplicate: 'We already received that request. Check your email before trying again.',
  'rate-limited': 'Too many attempts in a short time. Please wait a moment.',
  unavailable: 'The booking calendar is temporarily unavailable. Please try again shortly.',
  network: 'We could not reach the server. Please check your connection and try again.',
  timeout: 'The request took too long. Please try again.',
  'invalid_link': 'This management link is invalid or has expired.',
  forbidden: 'The site could not verify this request. Reload the page and try again, or email us directly.',
  server: 'Something went wrong at our end. Please try again, or email us directly.',
  validation: 'Some details need another look.',
}

export default {
  ScheduleApiError,
  fetchAvailability,
  createBooking,
  fetchManage,
  cancelBooking,
  rescheduleBooking,
  SCHEDULE_ERROR_COPY,
}
