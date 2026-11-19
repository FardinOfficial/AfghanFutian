import { CONTACT_DETAILS } from './navigation'

/**
 * SCHEDULING — public Cal.com integration configuration
 * ============================================================================
 * The complete booking flow is Cal.com's official booker, embedded in an
 * iframe. It owns availability, date and time selection, the booking form,
 * confirmation, Google Meet details, and the reschedule/cancel links in
 * Cal.com's confirmation email. Nothing here recreates that interface.
 *
 * Why an iframe rather than the Cal.com JavaScript embed
 * ----------------------------------------------------------------------------
 * The JavaScript embed would execute a third-party script in our document and
 * inject a <style> element. That would force `script-src https://app.cal.com`
 * and `'unsafe-inline'` into `style-src`. The iframe needs only
 * `frame-src https://cal.com` and isolates the provider's booking flow in its
 * own document. `ScheduleEmbed` accepts Cal.com's postMessage dimension events
 * so the frame follows the booker from month view to form to confirmation
 * without trapping a second scrollbar.
 *
 * Configuration
 * ----------------------------------------------------------------------------
 * Set `VITE_CAL_LINK` at BUILD TIME:
 *
 *     VITE_CAL_LINK=https://cal.com/afghanfutian/meeting
 *     VITE_CAL_LINK=afghanfutian/meeting
 *
 * The value is public and is baked into the browser bundle. When it is unset,
 * the page honestly says the calendar is not connected instead of rendering a
 * broken frame.
 *
 * The embed opens in Asia/Kabul. Cal.com's own timezone selector remains
 * available, so a visitor can change it manually. The host's availability
 * schedule must also be set to Kabul in the Cal.com dashboard; see README →
 * Scheduling.
 */

const RAW_LINK = import.meta.env?.VITE_CAL_LINK ?? ''

export const CAL_BASE_URL = 'https://cal.com'

/** IANA zone used as the booker's initial timezone. */
export const DEFAULT_TIME_ZONE = 'Asia/Kabul'

/** Human-facing label for the default zone. */
export const DEFAULT_TIME_ZONE_LABEL = 'Kabul, Afghanistan'

/** UTC offset shown next to the default zone. */
export const DEFAULT_TIME_ZONE_OFFSET = 'GMT+04:30'

/**
 * Reduce a configured value to `user/event` (or `team/user/event`).
 *
 * A full production URL is accepted and normalised so a stray scheme, host or
 * trailing slash cannot produce a broken double-prefixed URL.
 */
function normalizeCalLink(raw) {
  const value = String(raw ?? '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(?:www\.|app\.)?cal\.com\//i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '')

  return /^[\w.-]+(?:\/[\w.-]+)*$/.test(value) ? value : ''
}

/** Normalised event path, e.g. `afghanfutian/meeting`. */
export const CAL_LINK = normalizeCalLink(RAW_LINK)

/** The origins Cal.com uses to post iframe sizing messages to its parent. */
export const CAL_ORIGINS = ['https://cal.com', 'https://app.cal.com']

/** True once `VITE_CAL_LINK` points at a real Cal.com event. */
export const IS_SCHEDULING_CONFIGURED = CAL_LINK.length > 0

/**
 * Query parameters passed to Cal.com's official booker.
 *
 * Cal.com's current booker reads its initial zone from `cal.tz`; the more
 * obvious `timezone` and `timeZone` keys are ignored by the public booker.
 */
const timezoneParam = new URLSearchParams({ 'cal.tz': DEFAULT_TIME_ZONE }).toString()

/**
 * The URL loaded inside the embed.
 *
 * `embed=true` removes Cal.com's own site chrome, `theme=light` matches the
 * canvas ground, and `cal.tz` makes Kabul the initial zone. Cal.com's own
 * timezone selector remains visible for visitors who need another zone.
 */
export const CAL_EMBED_URL = IS_SCHEDULING_CONFIGURED
  ? `${CAL_BASE_URL}/${CAL_LINK}?embed=true&theme=light&${timezoneParam}`
  : null

/** The same official booking page, opened directly with the Kabul default. */
export const CAL_PUBLIC_URL = IS_SCHEDULING_CONFIGURED
  ? `${CAL_BASE_URL}/${CAL_LINK}?embed=true&theme=light&${timezoneParam}`
  : null

export const SCHEDULE_COPY = {
  label: 'Schedule',
  heading: 'Book a meeting.',
  support:
    'The official Cal.com calendar opens in Kabul, Afghanistan (GMT+04:30). Pick a genuinely open time, change the timezone inside the calendar if you need to, and receive confirmation and joining details by email.',

  /** Shown above the embed: the provider's actual workflow. */
  stepsLabel: 'How it works',
  steps: [
    'Choose a date and one of the open slots shown by Cal.com.',
    'The calendar opens in Kabul time; use its timezone selector to change it.',
    'Your confirmation email includes Google Meet details and reschedule/cancel links.',
  ],

  /** Shown beside the embed: what Cal.com will ask for. */
  fieldsLabel: 'What you will be asked',
  fields: [
    'Your name and email address',
    'Your company or organisation — optional',
    'The purpose of the meeting',
    'Anything else you want us to know — optional',
  ],

  /** Reassurance about what happens after booking. */
  afterLabel: 'After you book',
  after: [
    'A confirmation email with the date, the time and Google Meet details',
    'A link to reschedule or cancel, should something change',
    'A reminder before the meeting',
  ],

  /** The honest state when no calendar has been connected yet. */
  unconfigured: {
    label: 'Not yet connected',
    heading: 'The calendar is not connected yet.',
    body: 'Online booking is built and ready, but no Cal.com calendar has been attached to this deployment. Until one is, please send an enquiry and we will arrange a time directly.',
    note: 'Setting this up takes one public build variable and a Cal.com account — the exact steps are in the project README.',
  },
}

/** The enquiry fallback shown whenever booking is unavailable. */
export const SCHEDULE_FALLBACK_EMAIL = CONTACT_DETAILS.email

export default {
  CAL_LINK,
  CAL_EMBED_URL,
  CAL_ORIGINS,
  CAL_PUBLIC_URL,
  DEFAULT_TIME_ZONE,
  IS_SCHEDULING_CONFIGURED,
  SCHEDULE_COPY,
}
