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
 *      Content-Security-Policy is `script-src 'self'` — no inline scripts, no
 *      third-party script hosts — and that is a property worth keeping. The
 *      embed script would force `script-src https://app.cal.com`, and Cal.com's
 *      loader injects a <style> element, which would force `'unsafe-inline'`
 *      into `style-src` as well.
 *   2. The booking flow is then isolated in its own document. A failure or a
 *      change on Cal.com's side cannot reach into this page.
 *
 * The iframe needs exactly one CSP relaxation — `frame-src https://cal.com` —
 * which is already applied in `public/_headers` and `vercel.json`.
 *
 * Configuration
 * ----------------------------------------------------------------------------
 * Set `VITE_CAL_LINK` at build time to the Cal.com event type's path:
 *
 *     VITE_CAL_LINK=afghan-futian/discovery
 *       → https://cal.com/afghan-futian/discovery
 *
 * It is a *public* value (it is the URL a visitor is sent to), so it belongs in
 * the VITE_ namespace. When it is unset — the default in this repository — the
 * page does not pretend to offer booking. It says the calendar is not connected
 * yet and routes the visitor to the enquiry form and the contact address
 * instead, because a broken calendar is worse than an honest message.
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

/** Normalised so a leading/trailing slash in the env var cannot break the URL. */
export const CAL_LINK = RAW_LINK.trim().replace(/^\/+|\/+$/g, '')

export const CAL_BASE_URL = 'https://cal.com'

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

  /** Shown above the embed: what the visitor will be asked for. */
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
  CAL_PUBLIC_URL,
  IS_SCHEDULING_CONFIGURED,
  SCHEDULE_COPY,
}
