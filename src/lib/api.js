/**
 * CONTACT SUBMISSION LAYER
 * ============================================================================
 * The single place where the website talks to a backend. The backend now exists
 * — `api/contact.js`, a Vercel Function — so this file is the client half of a
 * working pair rather than a stub waiting for a server. Point
 * `VITE_API_BASE_URL` somewhere else and it talks to that instead.
 *
 * ── Configuration ────────────────────────────────────────────────────────────
 * Set `VITE_API_BASE_URL` to the API origin. When it is unset (the default) the
 * base is empty and the endpoint resolves to the same origin as the site, which
 * is what the bundled function wants:
 *
 *     VITE_API_BASE_URL=https://api.afghanfutian.com   →  POST /api/contact there
 *     (unset)                                          →  POST /api/contact here
 *
 * ── Request contract ─────────────────────────────────────────────────────────
 *     POST  {base}/api/contact
 *     Content-Type: application/json
 *
 *     {
 *       "name":     "…",        // required, 2–80
 *       "company":  "…",        // optional, ≤120
 *       "email":    "…",        // required, valid address, ≤254
 *       "phone":    "…",        // optional, ≤40
 *       "country":  "…",        // optional, ≤80
 *       "service":  "…",        // required, one of SERVICE_OPTIONS
 *       "website":  "…",        // honeypot; people leave it empty
 *       "meta": {               // context the server cannot infer, all optional
 *         "submittedAt": "2026-01-01T00:00:00.000Z",  // when the request was built
 *         "startedAt":   "2026-01-01T00:00:00.000Z",  // when filling began
 *         "locale":      "en-GB",
 *         "path":        "/contact"
 *       }
 *     }
 *
 * `startedAt` is deliberately different from `submittedAt`. The server's timing
 * guard measures how long a visitor spent on the form; a timestamp created at
 * send time would make every genuine enquiry look instantaneous.
 *
 * ── Response contract ────────────────────────────────────────────────────────
 *     201  { "ok": true,  "id": "<provider message id>" }   accepted for delivery
 *     201  { "ok": true,  "id": "…", "duplicate": true }    already accepted
 *     201  { "ok": true,  "id": null }                      silent bot drop
 *     400  { "ok": false, "errors": { "<field>": "<message>" } }   ← field-level
 *     429  { "ok": false, "errors": { "message": "…" } }           ← rate limited
 *     5xx  anything; treated as a generic failure
 *
 * Only a `201` carrying a real provider id counts as success. A `201` with a
 * null id is a silent bot drop and is reported as a failure here, so a genuine
 * submission can never be told it was delivered when nothing was handed over.
 * See `api/contact.js` for the server side.
 *
 * ── Error handling ───────────────────────────────────────────────────────────
 * Everything is normalised into a `ContactSubmitError` carrying a `kind`, so the
 * UI can respond to the *reason* rather than parsing messages:
 *
 *     'validation'  server rejected fields; `fieldErrors` holds them
 *     'rate-limited'
 *     'timeout'
 *     'network'
 *     'server'
 *
 * The caller decides what to do. The form shows field errors inline where it can,
 * and offers a `mailto:` fallback so an enquiry is never lost.
 */

const RAW_BASE = import.meta.env?.VITE_API_BASE_URL ?? ''

/** Trailing slash removed so the path join is always exactly one slash. */
const API_BASE = RAW_BASE.replace(/\/+$/, '')

export const CONTACT_ENDPOINT = `${API_BASE}/api/contact`

/** How long to wait before giving up. Long enough for a slow mobile connection. */
const TIMEOUT_MS = 12000

export class ContactSubmitError extends Error {
  constructor(kind, message, fieldErrors = null) {
    super(message)
    this.name = 'ContactSubmitError'
    this.kind = kind
    this.fieldErrors = fieldErrors
  }
}

/** The visible honeypot. Bots fill it; people never see it. */
export const HONEYPOT_FIELD = 'website'

/**
 * Build the request body from raw form values.
 * Kept separate so the shape can be asserted without performing a request.
 *
 * @param {Record<string, string>} values raw form values
 * @param {{ honeypot?: string, startedAt?: number | null, locale?: string }} [options]
 */
export function buildContactPayload(values, options = {}) {
  const clean = (key) => (values[key] ?? '').trim()
  const { honeypot = '', startedAt = null, locale } = options

  return {
    name: clean('name'),
    company: clean('company'),
    email: clean('email'),
    phone: clean('phone'),
    country: clean('country'),
    service: clean('service'),
    message: clean('message'),
    website: typeof honeypot === 'string' ? honeypot : '',
    meta: {
      submittedAt: new Date().toISOString(),
      // JSON.stringify drops undefined, so an absent start time is simply not
      // sent. The server then skips its timing check instead of guessing.
      startedAt: Number.isFinite(startedAt) ? new Date(startedAt).toISOString() : undefined,
      locale: locale ?? (typeof navigator !== 'undefined' ? navigator.language : undefined),
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    },
  }
}

/**
 * Submit a contact enquiry.
 *
 * @param {Record<string, string>} values raw form values
 * @param {{ honeypot?: string, startedAt?: number | null, locale?: string }} [options]
 * @returns {Promise<{ id: string }>}
 * @throws {ContactSubmitError}
 */
export async function submitContactForm(values, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildContactPayload(values, options)),
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ContactSubmitError(
        'timeout',
        'The request took too long to complete. Please try again.',
      )
    }
    throw new ContactSubmitError(
      'network',
      'We could not reach the server. Please check your connection and try again.',
    )
  } finally {
    clearTimeout(timer)
  }

  // Read the body once, tolerating a non-JSON response (a proxy error page, say).
  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (response.ok) {
    // A 201 with no provider id is a silent drop (honeypot / too-fast guard),
    // not a delivered enquiry. Never present it as success to a real visitor.
    if (data?.ok === true && typeof data.id === 'string' && data.id) {
      return { id: data.id }
    }
    throw new ContactSubmitError(
      'server',
      'We could not confirm that your enquiry was sent. Please email us directly.',
    )
  }

  if (response.status === 400) {
    throw new ContactSubmitError(
      'validation',
      'Some details need another look.',
      data?.errors ?? null,
    )
  }

  if (response.status === 429) {
    throw new ContactSubmitError(
      'rate-limited',
      'That is a few enquiries in quick succession. Please wait a moment and try again.',
    )
  }

  throw new ContactSubmitError(
    'server',
    'Something went wrong at our end. Please try again, or email us directly.',
  )
}

export default submitContactForm
