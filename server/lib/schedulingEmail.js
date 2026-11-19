import { COMPANY, siteUrl } from '../../src/data/company.js'
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
 */

const LOGO_URL = `${COMPANY.website}/logo-mark-light.png`

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const CONTENT = {
  confirmation: {
    eyebrow: 'Meeting confirmed',
    heading: 'Your meeting is scheduled.',
    intro: (b) =>
      `Thank you, ${b.name}. Your meeting with ${COMPANY.legalName} is confirmed. The joining details are below and in your calendar invitation.`,
    preheader: 'Your meeting details, Google Meet link and secure management link.',
  },
  notification: {
    eyebrow: 'New booking',
    heading: 'A meeting has been booked.',
    intro: (b) =>
      `${b.name}${b.company ? ` of ${b.company}` : ''} has booked a meeting with ${COMPANY.legalName}.`,
    preheader: 'A new meeting was booked through afghanfutian.com.',
  },
  reminder: {
    eyebrow: 'Meeting reminder',
    heading: 'Your meeting is coming up.',
    intro: (b) =>
      `This is a reminder that your meeting with ${COMPANY.legalName} is scheduled for ${formatDate(b.start, b.timeZone)} at ${formatTime(b.start, b.timeZone)} ${zoneLabel(b.start, b.timeZone)}.`,
    preheader: 'A reminder for your upcoming Afghan Futian meeting.',
  },
  cancellation: {
    eyebrow: 'Meeting cancelled',
    heading: 'The meeting has been cancelled.',
    intro: (b) =>
      `The meeting scheduled for ${formatDate(b.start, b.timeZone)} at ${formatTime(b.start, b.timeZone)} ${zoneLabel(b.start, b.timeZone)} has been cancelled.`,
    preheader: 'Your Afghan Futian meeting has been cancelled.',
  },
  reschedule: {
    eyebrow: 'Meeting rescheduled',
    heading: 'Your meeting has a new time.',
    intro: (b) =>
      `Your meeting with ${COMPANY.legalName} has been rescheduled to ${formatDate(b.start, b.timeZone)} at ${formatTime(b.start, b.timeZone)} ${zoneLabel(b.start, b.timeZone)}.`,
    preheader: 'Your Afghan Futian meeting has a new date or time.',
  },
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

function meetingRows(booking) {
  const date = formatDate(booking.start, booking.timeZone)
  const time = `${formatTime(booking.start, booking.timeZone)} – ${formatTime(booking.end, booking.timeZone)}`
  const zone = `${booking.timeZone} (${zoneLabel(booking.start, booking.timeZone)})`
  const meet = booking.meetingUrl
    ? `<a href="${escapeHtml(booking.meetingUrl)}" style="color:#141414;text-decoration:underline;">Join Google Meet</a>`
    : 'The Google Meet link is included in your calendar invitation. If it is missing, reply to this email.'

  return [
    detailRow('Name', escapeHtml(booking.name)),
    booking.company ? detailRow('Company', escapeHtml(booking.company)) : '',
    booking.phone ? detailRow('Phone', escapeHtml(booking.phone)) : '',
    detailRow('Date', escapeHtml(date)),
    detailRow('Time', escapeHtml(time)),
    detailRow('Timezone', escapeHtml(zone)),
    detailRow('Duration', `${SCHEDULE_EVENT.durationMinutes} minutes`),
    detailRow('Reference', escapeHtml(booking.reference)),
    booking.purpose ? detailRow('Notes', escapeHtml(booking.purpose)) : '',
    detailRow('Google Meet', meet),
  ].join('')
}

function htmlFor(kind, booking) {
  const copy = CONTENT[kind]
  const calendar = addToCalendarUrl({
    start: booking.start,
    end: booking.end,
    title: SCHEDULE_EVENT.title,
    description: `Reference: ${booking.reference}\nNotes: ${booking.purpose || 'Not specified'}`,
    location: booking.meetingUrl || SCHEDULE_EVENT.location,
    meetingUrl: booking.meetingUrl,
  })
  const manage = booking.manageToken ? manageUrl(booking.manageToken) : ''
  const schedule = siteUrl('/schedule')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(copy.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#e9e9e3;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(copy.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e9e9e3;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background:#f4f3ef;">
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
                <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;line-height:17px;letter-spacing:0.18em;text-transform:uppercase;color:#66665f;">${escapeHtml(copy.eyebrow)}</p>
                <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1.12;letter-spacing:-0.02em;font-weight:normal;color:#141414;">${escapeHtml(copy.heading)}</h1>
                <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#4f4f49;">${escapeHtml(copy.intro(booking))}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #d6d6ce;border-bottom:1px solid #d6d6ce;">
                  ${meetingRows(booking)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 28px;">
                ${button(calendar, 'Add to calendar', true)}
                ${booking.meetingUrl ? button(booking.meetingUrl, 'Open Google Meet') : ''}
                ${manage ? `<p style="margin:18px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#66665f;">Need a different time? This signed link works without an account. Keep it private.</p>${button(manage, 'Reschedule or cancel')}` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 36px;background:#141414;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#f4f3ef;">
                  Questions? Write to <a href="${escapeHtml(COMPANY.emailHref)}" style="color:#d5ff55;text-decoration:underline;">${escapeHtml(COMPANY.email)}</a>,
                  call ${escapeHtml(COMPANY.phones[0].display)} (China) or ${escapeHtml(COMPANY.phones[1].display)} (Afghanistan), or visit
                  <a href="${escapeHtml(COMPANY.website)}" style="color:#d5ff55;text-decoration:underline;">afghanfutian.com</a>.
                </p>
                <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:17px;letter-spacing:0.08em;text-transform:uppercase;color:#a8a8a0;">
                  ${escapeHtml(COMPANY.legalName)} · Yiwu, China · Kabul, Afghanistan
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 36px;background:#e9e9e3;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:17px;color:#66665f;">
                You are receiving this message because a meeting was booked at <a href="${escapeHtml(schedule)}" style="color:#141414;text-decoration:underline;">${escapeHtml(schedule)}</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function textFor(kind, booking) {
  const copy = CONTENT[kind]
  const lines = [
    copy.heading,
    '',
    copy.intro(booking),
    '',
    `Name: ${booking.name}`,
    booking.company ? `Company: ${booking.company}` : '',
    booking.phone ? `Phone: ${booking.phone}` : '',
    `Date: ${formatDate(booking.start, booking.timeZone)}`,
    `Time: ${formatTime(booking.start, booking.timeZone)} – ${formatTime(booking.end, booking.timeZone)}`,
    `Timezone: ${booking.timeZone} (${zoneLabel(booking.start, booking.timeZone)})`,
    `Duration: ${SCHEDULE_EVENT.durationMinutes} minutes`,
    `Reference: ${booking.reference}`,
    booking.purpose ? `Notes: ${booking.purpose}` : '',
    `Google Meet: ${booking.meetingUrl || 'Included in your calendar invitation'}`,
    `Add to calendar: ${addToCalendarUrl({
      start: booking.start,
      end: booking.end,
      title: SCHEDULE_EVENT.title,
      description: `Reference: ${booking.reference}`,
      location: booking.meetingUrl || SCHEDULE_EVENT.location,
      meetingUrl: booking.meetingUrl,
    })}`,
    booking.manageToken ? `Reschedule or cancel (private signed link): ${manageUrl(booking.manageToken)}` : '',
    '',
    `${COMPANY.legalName}`,
    `${COMPANY.email}`,
    `${COMPANY.phones[0].display} (China) · ${COMPANY.phones[1].display} (Afghanistan)`,
    COMPANY.website,
    'Yiwu, China · Kabul, Afghanistan',
  ]
  return lines.filter(Boolean).join('\n')
}

const SUBJECTS = {
  confirmation: `Meeting confirmed — ${SCHEDULE_EVENT.title}`,
  notification: `New meeting booked — ${SCHEDULE_EVENT.title}`,
  reminder: `Reminder: ${SCHEDULE_EVENT.title}`,
  cancellation: `Meeting cancelled — ${SCHEDULE_EVENT.title}`,
  reschedule: `Meeting rescheduled — ${SCHEDULE_EVENT.title}`,
}

export function schedulingEmail(kind, booking) {
  if (!CONTENT[kind]) throw new Error(`Unknown scheduling email kind: ${kind}`)
  return {
    subject: SUBJECTS[kind],
    html: htmlFor(kind, booking),
    text: textFor(kind, booking),
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
  const stamp = (value) => new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const escapeIcs = (value) =>
    String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')

  // The signed management link stays in the email, not in the .ics file:
  // calendar files are routinely forwarded and synced to shared calendars.
  const description = [
    `Reference: ${booking.reference}`,
    `Notes: ${booking.purpose || 'Not specified'}`,
    booking.meetingUrl ? `Join: ${booking.meetingUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n')

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
