import { COMPANY, siteUrl } from '../../src/data/company.js'
import { emailCopy, emailDirection, emailLocale, fill } from '../../src/i18n/serverCopy.js'
import {
  addToCalendarUrl,
  formatDate,
  formatTime,
  manageUrl,
  SCHEDULE_EVENT,
  zoneLabel,
} from '../../src/lib/scheduling.js'

/**
 * BRANDED SCHEDULING EMAILS
 * ============================================================================
 * Email-client-compatible HTML (tables, inline styles, no web fonts, no flex,
 * no external CSS) with a matching plain-text part for every message.
 *
 * These templates are rendered on the server and sent through Resend. They are
 * intentionally separate from Cal.com's own notifications: if the Cal.com plan
 * cannot disable or white-label its default messages, the templates can still
 * be used for the company notification and any workflow-driven reminder. The
 * README documents that plan limitation rather than pretending it is solved.
 *
 * Every customer-facing string comes from the same locale dictionaries used by
 * the site. Official company values (names, phone numbers, URLs, signed links)
 * are passed in as data; only the surrounding prose is translated.
 */

const LOGO_URL = `${COMPANY.website}/logo-mark-light.png`

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Resolve the visitor's locale once per message. A top-level `locale` on the
 * booking view wins over Cal.com's `metadata.locale`; anything unknown falls
 * back to English through `emailCopy`, so a malformed value can never blank an
 * email. `c(key, values)` translates by using the English key as the lookup id
 * and filling any `{{placeholders}}` it contains.
 */
function copyFor(booking) {
  const requested = booking?.locale || booking?.metadata?.locale || 'en'
  const dictionary = emailCopy(requested)
  return {
    locale: emailLocale(requested),
    dir: emailDirection(requested),
    c: (key, values) => fill(dictionary[key] ?? key, values),
  }
}

const CONTENT = {
  confirmation: {
    subject: 'Meeting confirmed — Afghan Futian Trading Company — Meeting',
    eyebrow: 'Meeting confirmed',
    heading: 'Your meeting is scheduled.',
    intro:
      'Thank you, {{name}}. Your meeting with {{company}} is confirmed. The joining details are below and in your calendar invitation.',
    preheader: 'Your meeting details, Google Meet link and secure management link.',
  },
  notification: {
    subject: 'New meeting booked — Afghan Futian Trading Company — Meeting',
    eyebrow: 'New booking',
    heading: 'A meeting has been booked.',
    intro: '{{name}} has booked a meeting with {{company}}.',
    preheader: 'A new meeting was booked through afghanfutian.com.',
  },
  reminder: {
    subject: 'Reminder: Afghan Futian Trading Company — Meeting',
    eyebrow: 'Meeting reminder',
    heading: 'Your meeting is coming up.',
    intro:
      'This is a reminder that your meeting with {{company}} is scheduled for {{date}} at {{time}} {{zone}}.',
    preheader: 'A reminder for your upcoming Afghan Futian meeting.',
  },
  cancellation: {
    subject: 'Meeting cancelled — Afghan Futian Trading Company — Meeting',
    eyebrow: 'Meeting cancelled',
    heading: 'The meeting has been cancelled.',
    intro: 'The meeting scheduled for {{date}} at {{time}} {{zone}} has been cancelled.',
    preheader: 'Your Afghan Futian meeting has been cancelled.',
  },
  reschedule: {
    subject: 'Meeting rescheduled — Afghan Futian Trading Company — Meeting',
    eyebrow: 'Meeting rescheduled',
    heading: 'Your meeting has a new time.',
    intro: 'Your meeting with {{company}} has been rescheduled to {{date}} at {{time}} {{zone}}.',
    preheader: 'Your Afghan Futian meeting has a new date or time.',
  },
}

function introVars(booking) {
  return {
    name: booking.company ? `${booking.name} of ${booking.company}` : booking.name,
    company: COMPANY.legalName,
    date: formatDate(booking.start, booking.timeZone),
    time: formatTime(booking.start, booking.timeZone),
    zone: zoneLabel(booking.start, booking.timeZone),
  }
}

function detailRow(label, value) {
  return `
    <tr>
      <td style="padding:9px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;letter-spacing:0.12em;text-transform:uppercase;color:#66665f;width:36%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:9px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#141414;vertical-align:top;word-break:break-word;">${value}</td>
    </tr>`
}

function button(href, label, accent = false) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;margin:0 8px 8px 0;">
      <tr>
        <td style="background:${accent ? '#d5ff55' : '#141414'};border-radius:6px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 20px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;line-height:1;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:${accent ? '#141414' : '#f4f3ef'};">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`
}

function meetingRows(booking, c) {
  const date = formatDate(booking.start, booking.timeZone)
  const time = `${formatTime(booking.start, booking.timeZone)} – ${formatTime(booking.end, booking.timeZone)}`
  const zone = `${booking.timeZone} (${zoneLabel(booking.start, booking.timeZone)})`
  const meet = booking.meetingUrl
    ? `<a href="${escapeHtml(booking.meetingUrl)}" style="color:#141414;text-decoration:underline;">${escapeHtml(c('Join Google Meet'))}</a>`
    : escapeHtml(
        c('The Google Meet link is included in your calendar invitation. If it is missing, reply to this email.'),
      )

  return [
    detailRow(c('Name'), escapeHtml(booking.name)),
    booking.company ? detailRow(c('Company'), escapeHtml(booking.company)) : '',
    booking.phone ? detailRow(c('Phone'), escapeHtml(booking.phone)) : '',
    detailRow(c('Date'), escapeHtml(date)),
    detailRow(c('Time'), escapeHtml(time)),
    detailRow(c('Timezone'), escapeHtml(zone)),
    detailRow(c('Duration'), escapeHtml(c('{{minutes}} minutes', { minutes: SCHEDULE_EVENT.durationMinutes }))),
    detailRow(c('Reference'), escapeHtml(booking.reference)),
    booking.purpose ? detailRow(c('Notes'), escapeHtml(booking.purpose)) : '',
    detailRow(c('Google Meet'), meet),
  ].join('')
}

function calendarDescription(booking, c, joinSeparator = '\n') {
  const base = [
    `${c('Reference')}: ${booking.reference}`,
    `${c('Notes')}: ${booking.purpose || c('Not specified')}`,
  ].join('\n')
  return booking.meetingUrl
    ? `${base}${joinSeparator}${c('Join: {{url}}', { url: booking.meetingUrl })}`
    : base
}

function htmlFor(kind, booking, { c, locale, dir }) {
  const copy = CONTENT[kind]
  const calendar = addToCalendarUrl({
    start: booking.start,
    end: booking.end,
    title: SCHEDULE_EVENT.title,
    description: calendarDescription(booking, c, '\n\n'),
    location: booking.meetingUrl || SCHEDULE_EVENT.location,
  })
  const manage = booking.manageToken ? manageUrl(booking.manageToken) : ''
  const schedule = siteUrl('/schedule')
  const questions = c(
    'Questions? Write to {{email}}, call {{phoneChina}} (China) or {{phoneAfghanistan}} (Afghanistan), or visit {{website}}.',
    {
      email: `<a href="${escapeHtml(COMPANY.emailHref)}" style="color:#d5ff55;text-decoration:underline;">${escapeHtml(COMPANY.email)}</a>`,
      phoneChina: escapeHtml(COMPANY.phones[0].display),
      phoneAfghanistan: escapeHtml(COMPANY.phones[1].display),
      website: `<a href="${escapeHtml(COMPANY.website)}" style="color:#d5ff55;text-decoration:underline;">${escapeHtml(COMPANY.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`,
    },
  )
  const receiving = c('You are receiving this message because a meeting was booked at {{url}}.', {
    url: `<a href="${escapeHtml(schedule)}" style="color:#141414;text-decoration:underline;">${escapeHtml(schedule)}</a>`,
  })

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(c(copy.heading))}</title>
  </head>
  <body style="margin:0;padding:0;background:#e9e9e3;" dir="${dir}">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(c(copy.preheader))}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e9e9e3;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background:#f4f3ef;" dir="${dir}">
            <tr>
              <td style="height:4px;background:#d5ff55;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:26px 36px;background:#141414;">
                <img src="${LOGO_URL}" width="150" alt="${escapeHtml(COMPANY.legalName)}" style="display:block;max-width:150px;height:auto;border:0;" />
                <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;letter-spacing:0.18em;text-transform:uppercase;color:#d5ff55;">${escapeHtml(COMPANY.legalName)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 36px 10px;">
                <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;line-height:17px;letter-spacing:0.18em;text-transform:uppercase;color:#66665f;">${escapeHtml(c(copy.eyebrow))}</p>
                <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1.12;letter-spacing:-0.02em;font-weight:normal;color:#141414;">${escapeHtml(c(copy.heading))}</h1>
                <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#4f4f49;">${escapeHtml(c(copy.intro, introVars(booking)))}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #d6d6ce;border-bottom:1px solid #d6d6ce;">
                  ${meetingRows(booking, c)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 28px;">
                ${button(calendar, c('Add to calendar'), true)}
                ${booking.meetingUrl ? button(booking.meetingUrl, c('Open Google Meet')) : ''}
                ${manage ? `<p style="margin:18px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#66665f;">${escapeHtml(c('Need a different time? This signed link works without an account. Keep it private.'))}</p>${button(manage, c('Reschedule or cancel'))}` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 36px;background:#141414;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#f4f3ef;">
                  ${questions}
                </p>
                <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:17px;letter-spacing:0.08em;text-transform:uppercase;color:#a8a8a0;">
                  ${escapeHtml(c('Afghan Futian Trading Company · Yiwu, China · Kabul, Afghanistan'))}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 36px;background:#e9e9e3;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:17px;color:#66665f;">
                ${receiving}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function textFor(kind, booking, { c }) {
  const copy = CONTENT[kind]
  const lines = [
    c(copy.heading),
    '',
    c(copy.intro, introVars(booking)),
    '',
    `${c('Name')}: ${booking.name}`,
    booking.company ? `${c('Company')}: ${booking.company}` : '',
    booking.phone ? `${c('Phone')}: ${booking.phone}` : '',
    `${c('Date')}: ${formatDate(booking.start, booking.timeZone)}`,
    `${c('Time')}: ${formatTime(booking.start, booking.timeZone)} – ${formatTime(booking.end, booking.timeZone)}`,
    `${c('Timezone')}: ${booking.timeZone} (${zoneLabel(booking.start, booking.timeZone)})`,
    `${c('Duration')}: ${c('{{minutes}} minutes', { minutes: SCHEDULE_EVENT.durationMinutes })}`,
    `${c('Reference')}: ${booking.reference}`,
    booking.purpose ? `${c('Notes')}: ${booking.purpose}` : '',
    `${c('Google Meet')}: ${booking.meetingUrl || c('Included in your calendar invitation')}`,
    `${c('Add to calendar')}: ${addToCalendarUrl({
      start: booking.start,
      end: booking.end,
      title: SCHEDULE_EVENT.title,
      description: booking.meetingUrl
        ? `${c('Reference')}: ${booking.reference}\n\n${c('Join: {{url}}', { url: booking.meetingUrl })}`
        : `${c('Reference')}: ${booking.reference}`,
      location: booking.meetingUrl || SCHEDULE_EVENT.location,
    })}`,
    booking.manageToken
      ? `${c('Reschedule or cancel')} (private signed link): ${manageUrl(booking.manageToken)}`
      : '',
    '',
    `${COMPANY.legalName}`,
    `${COMPANY.email}`,
    `${COMPANY.phones[0].display} (${COMPANY.phones[0].country}) · ${COMPANY.phones[1].display} (${COMPANY.phones[1].country})`,
    COMPANY.website,
    c('Afghan Futian Trading Company · Yiwu, China · Kabul, Afghanistan'),
  ]
  return lines.filter(Boolean).join('\n')
}

export function schedulingEmail(kind, booking) {
  if (!CONTENT[kind]) throw new Error(`Unknown scheduling email kind: ${kind}`)
  const context = copyFor(booking)
  return {
    subject: context.c(CONTENT[kind].subject, { eventTitle: SCHEDULE_EVENT.title }),
    html: htmlFor(kind, booking, context),
    text: textFor(kind, booking, context),
  }
}

/** RFC 5545 line folding: max 75 octets, continuations begin with one space. */
function foldIcsLine(line) {
  const parts = []
  let current = ''
  let bytes = 0

  for (const character of line) {
    const size = Buffer.byteLength(character, 'utf8')
    if (bytes + size > 73) {
      parts.push(current)
      current = ' '
      bytes = 1
    }
    current += character
    bytes += size
  }

  parts.push(current)
  return parts.join('\r\n')
}

/** A standards-compliant VEVENT for Resend attachments and calendar clients. */
export function calendarAttachment(booking) {
  const { c } = copyFor(booking)
  const stamp = (value) => new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const escapeIcs = (value) =>
    String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')

  // The signed management link stays in the email, not in the .ics file:
  // calendar files are routinely forwarded and synced to shared calendars.
  const description = calendarDescription(booking, c)

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Afghan Futian Trading Company//Scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(booking.reference)}@afghanfutian.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(booking.start)}`,
    `DTEND:${stamp(booking.end)}`,
    `SUMMARY:${escapeIcs(SCHEDULE_EVENT.title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(booking.meetingUrl || SCHEDULE_EVENT.location)}`,
    `URL:${escapeIcs(booking.meetingUrl || siteUrl('/schedule'))}`,
    `ORGANIZER;CN=${escapeIcs(COMPANY.legalName)}:mailto:${COMPANY.email}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(foldIcsLine).join('\r\n')

  return {
    filename: 'afghan-futian-meeting.ics',
    content: Buffer.from(ics, 'utf8').toString('base64'),
  }
}

export default schedulingEmail
