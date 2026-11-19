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
 *       "message":  "…",        // required, 20–2000
 *       "meta": {               // context the server cannot infer, all optional
 *         "submittedAt": "2026-01-01T00:00:00.000Z",
 *         "locale":      "en-GB",
 *         "path":        "/contact"
 *       }
 *     }
 *
 * ── Response contract ────────────────────────────────────────────────────────
 *     201  { "ok": true,  "id": "<provider message id>" }   accepted for delivery
 *     400  { "ok": false, "errors": { "<field>": "<message>" } }   ← field-level
 *     429  { "ok": false, "errors": { "message": "…" } }           ← rate limited
 *     5xx  anything; treated as a generic failure
 *
 * `201` means the mail service *accepted* the message — it is not a promise that
 * it was delivered, but it is a promise that it was handed over. The form shows
 * success on nothing less. See `api/contact.js` for the server side.
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
 */
export function buildContactPayload(values) {
  const clean = (key) => (values[key] ?? '').trim()

  return {
    name: clean('name'),
    company: clean('company'),
    email: clean('email'),
    phone: clean('phone'),
    country: clean('country'),
    service: clean('service'),
    message: clean('message'),
    meta: {
      submittedAt: new Date().toISOString(),
      locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    },
  }
}

/**
 * Submit a contact enquiry.
 *
 * @param {Record<string, string>} values raw form values
 * @returns {Promise<{ id: string | null }>}
 * @throws {ContactSubmitError}
 */
export async function submitContactForm(values) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildContactPayload(values)),
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
    return { id: data?.id ?? null }
  }

  if (response.status === 400) {
    throw new ContactSubmitError(
      'validation',
      'Some of the details need another look.',
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
