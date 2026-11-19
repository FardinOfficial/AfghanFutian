import { SCHEDULE_EVENT } from '../lib/scheduling.js'
import { CONTACT_DETAILS } from './navigation.js'
// One event contract: the browser, the functions and the email templates all
// read the same constants from the provider-free scheduling module.
export { SCHEDULE_EVENT }

/**
 * SCHEDULING — public, client-safe configuration and copy
 * ============================================================================
 * Availability and bookings are NOT configured here. They come from the
 * consolidated serverless functions in `api/`, which call Cal.com API v2 with a
 * private key. This module holds only what is safe to ship to the browser:
 * event facts and the public booking URL used as an escape hatch if the backend
 * is unreachable.
 *
 * Never add a secret, API key or webhook secret to this file. `VITE_*` values
 * are embedded in the client bundle at build time.
 */

const RAW_LINK = import.meta.env?.VITE_CAL_LINK ?? ''

export const CAL_BASE_URL = 'https://cal.com'

function normalizeCalLink(raw) {
  const value = String(raw ?? '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(?:www\.|app\.)?cal\.com\//i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '')

  return /^[\w.-]+(?:\/[\w.-]+)*$/.test(value) ? value : ''
}

/** Normalised public path, e.g. `afghanfutian/meeting`. */
export const CAL_LINK = normalizeCalLink(RAW_LINK)

export const CAL_PUBLIC_URL = CAL_LINK ? `${CAL_BASE_URL}/${CAL_LINK}` : null

export const SCHEDULE_FALLBACK_EMAIL = CONTACT_DETAILS.email

export default {
  CAL_LINK,
  CAL_PUBLIC_URL,
  SCHEDULE_EVENT,
  SCHEDULE_FALLBACK_EMAIL,
}
