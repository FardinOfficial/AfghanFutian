import { SCHEDULE_EVENT } from '../lib/scheduling.js'
import { CONTACT_DETAILS } from './navigation.js'
// One event contract: the browser, the functions and the email templates all
// read the same constants from the provider-free scheduling module.
export { SCHEDULE_EVENT }

/**
 * SCHEDULING — public, client-safe configuration and copy
 * ============================================================================
 * Availability and bookings are NOT configured here. They come from the
 * serverless functions under `api/schedule/`, which call Cal.com API v2 with a
 * private key. This module holds only what is safe to ship to the browser:
 * event facts, error-free copy, and the public booking URL used as an escape
 * hatch if the backend is unreachable.
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

export const SCHEDULE_COPY = {
  label: 'Schedule',
  heading: 'Book a meeting.',
  support:
    'Choose a date, a time in your own timezone and a few details. Every slot shown comes directly from our live calendar, and your confirmation arrives by email the moment the booking is made.',

  stepsLabel: 'How it works',
  steps: [
    'Pick an open date and time — nothing is shown that the calendar does not offer.',
    'Tell us who you are and what you would like to discuss.',
    'Review and confirm. The Google Meet link is sent by email and added to your calendar.',
  ],

  fieldsLabel: 'What you will be asked',
  fields: [
    'Your name and email address',
    'Your company or organisation — optional',
    'A phone number — optional',
    'The purpose of the meeting',
  ],

  afterLabel: 'After you book',
  after: [
    'A confirmation email with the date, time and joining details',
    'A calendar invitation and a reminder before the meeting',
    'A secure link to reschedule or cancel, should something change',
  ],

  unconfigured: {
    label: 'Booking unavailable',
    heading: 'Online booking is temporarily unavailable.',
    body: 'The booking service has not been configured on this deployment. Until it is, please send an enquiry and we will arrange a time directly.',
    note: 'The server-side scheduler needs Cal.com and Resend credentials. See the project README for the exact configuration steps.',
  },
}

export const SCHEDULE_FALLBACK_EMAIL = CONTACT_DETAILS.email

export default {
  CAL_LINK,
  CAL_PUBLIC_URL,
  SCHEDULE_EVENT,
  SCHEDULE_COPY,
  SCHEDULE_FALLBACK_EMAIL,
}
