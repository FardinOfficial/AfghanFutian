import { CONTACT_DETAILS } from './navigation'

/**
 * SCHEDULING — Cal.com integration
 * ============================================================================
 * "Schedule a Meeting" is a real booking flow, not a form that pretends to be
 * one. The availability shown to a visitor is the real availability of the
 * company's calendar, and a confirmed booking is a confirmed booking — it
 * appears on the calendar and cannot be double-booked.
 *
 * Why an iframe rather than the Cal.com embed script
 * ----------------------------------------------------------------------------
 * Cal.com ships a JavaScript embed that renders inside our page and looks a
 * little more seamless. It is deliberately not used here, for two reasons:
 *
 *   1. It is a third-party script executed in our document. The site's
 *      Content-Security-Policy is `script-src 'self'` — no inline scripts,
 *      no third-party script hosts — and that is a property worth keeping. The
 *      embed script would force `script-src https://app.cal.com`, and Cal.com's
 *      loader injects a <style> element, which would force `'unsafe-inline'`
 *      into `style-src` as well.
 *   2. The booking flow is then isolated in its own document. A failure or a
 *      change on Cal.com's side cannot reach into this page.
 *
 * The iframe needs exactly one CSP relaxation — `frame-src https://cal.com` —
 * which is already applied in `public/_headers` and `vercel.json`. Cal.com's
 * own page sends no `X-Frame-Options` or `frame-ancestors` header, so it can be
 * framed. `ScheduleEmbed` listens for Cal.com's postMessage dimension events to
 * size the frame to the content, so there is no second scrollbar inside it.
 *
 * Configuration
 * ----------------------------------------------------------------------------
 * Set `VITE_CAL_LINK` at BUILD TIME to the event type. Both forms are accepted:
 *
 *     VITE_CAL_LINK=afghanfutian/meeting
 *     VITE_CAL_LINK=https://cal.com/afghanfutian/meeting
 *
 * Both produce `https://cal.com/afghanfutian/meeting`. A full URL is normalised
 * to its path, so a trailing slash or query string in the dashboard cannot
 * produce a broken double-prefixed URL.
 *
 * It is a *public* value (it is the URL a visitor is sent to), so it belongs in
 * the VITE_ namespace. `VITE_*` values are baked into the bundle at build time:
 * adding the variable in Vercel does nothing until the project is redeployed.
 * When it is unset — the default in this repository — the page does not pretend
 * to offer booking. It says the calendar is not connected yet and routes the
 * visitor to the enquiry form and the contact address instead, because a broken
 * calendar is worse than an honest message.
 *
 * What must be configured in the Cal.com account
 * ----------------------------------------------------------------------------
 * The fields the brief asks for are not all fields the website can supply; the
 * date, the available slots and the timezone are produced by Cal.com itself,
 * from the connected calendar and the visitor's browser. So the event type has
 * to be set up as follows (see README → "Scheduling"):
 *
 *   • Name, email — Cal.com's built-in booking fields. The email is required.
 *   • Company / organisation — a custom question, optional.
 *   • Purpose of the meeting — a custom question, required.
 *   • Anything else — a custom question, optional, long text.
 *   • Availability — the real working hours of the person taking the meeting.
 *   • Timezone — Cal.com converts to the visitor's own zone automatically.
 *   • Notifications — a workflow emailing contact@afghanfutian.com on every new
 *     booking, plus Cal.com's own confirmation to the visitor (which carries the
 *     reschedule and cancel links).
 */

const RAW_LINK = import.meta.env?.VITE_CAL_LINK ?? ''

export const CAL_BASE_URL = 'https://cal.com'

/**
 * Reduce a configured value to `user/event` (or `team/user/event`).
 *
 * Accepting a full URL as well as a bare path matters here: the production
 * value is `https://cal.com/afghanfutian/meeting`, and the old implementation
 * prefixed it with `https://cal.com/` again. Anything that is not a plain
 * cal.com path is rejected rather than turned into a link that 404s.
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

/** True once `VITE_CAL_LINK` has been set and a real calendar is connected. */
export const IS_SCHEDULING_CONFIGURED = CAL_LINK.length > 0

/**
 * The URL loaded inside the embed.
 *
 * `embed=true` tells Cal.com to render without its own site chrome, which is
 * what makes it work as an iframe target. `theme=light` matches the canvas
 * ground the embed sits on.
 */
export const CAL_EMBED_URL = IS_SCHEDULING_CONFIGURED
  ? `${CAL_BASE_URL}/${CAL_LINK}?embed=true&theme=light`
  : null

/** The same booking page, opened directly — used for the "open in a new tab" link. */
export const CAL_PUBLIC_URL = IS_SCHEDULING_CONFIGURED ? `${CAL_BASE_URL}/${CAL_LINK}` : null

export const SCHEDULE_COPY = {
  label: 'Schedule',
  heading: 'Book a meeting.',
  support:
    'Pick a date and a time that suits you. You will see the times that are genuinely open, in your own timezone, and you will get a confirmation by email the moment the booking is made.',

  /** Shown above the embed: the three steps from intent to confirmation. */
  stepsLabel: 'How it works',
  steps: [
    'Choose one of the open slots — the calendar shows real availability.',
    'The time is converted to your own timezone automatically.',
    'Your confirmation email includes links to reschedule or cancel.',
  ],

  /** Shown beside the embed: what the visitor will be asked for. */
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
    'A confirmation email with the date, the time and joining details',
    'A link to reschedule or cancel, should something change',
    'A reminder before the meeting',
  ],

  /** The honest state when no calendar has been connected yet. */
  unconfigured: {
    label: 'Not yet connected',
    heading: 'The calendar is not connected yet.',
    body: 'Online booking is built and ready, but no Cal.com calendar has been attached to this deployment. Until one is, please send an enquiry and we will arrange a time directly.',
    note: 'Setting this up takes one environment variable and a Cal.com account — the exact steps are in the project README.',
  },
}

/** The enquiry fallback shown whenever booking is unavailable. */
export const SCHEDULE_FALLBACK_EMAIL = CONTACT_DETAILS.email

export default {
  CAL_LINK,
  CAL_EMBED_URL,
  CAL_ORIGINS,
  CAL_PUBLIC_URL,
  IS_SCHEDULING_CONFIGURED,
  SCHEDULE_COPY,
}
