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

const LOGO_URL = `${COMPANY.website}/logo-mark.png`

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
  },
  notification: {
    eyebrow: 'New booking',
    heading: 'A meeting has been booked.',
    intro: (b) =>
      `${b.name}${b.company ? ` of ${b.company}` : ''} has booked a meeting with ${COMPANY.legalName}.`,
  },
  reminder: {
    eyebrow: 'Meeting reminder',
    heading: 'Your meeting is coming up.',
    intro: (b) =>
      `This is a reminder that your meeting with ${COMPANY.legalName} is scheduled for ${formatDate(b.start, b.timeZone)} at ${formatTime(b.start, b.timeZone)} ${zoneLabel(b.start, b.timeZone)}.`,
  },
  cancellation: {
    eyebrow: 'Meeting cancelled',
    heading: 'The meeting has been cancelled.',
    intro: (b) =>
      `The meeting scheduled for ${formatDate(b.start, b.timeZone)} at ${formatTime(b.start, b.timeZone)} ${zoneLabel(b.start, b.timeZone)} has been cancelled.`,
  },
  reschedule: {
    eyebrow: 'Meeting rescheduled',
    heading: 'Your meeting has a new time.',
    intro: (b) =>
      `Your meeting with ${COMPANY.legalName} has been rescheduled to ${formatDate(b.start, b.timeZone)} at ${formatTime(b.start, b.timeZone)} ${zoneLabel(b.start, b.timeZone)}.`,
  },
}

function detailRow(label, value) {
  return `
    <tr>
      <td style="padding:9px 0 9px 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;letter-spacing:0.12em;text-transform:uppercase;color:#66665f;width:38%;">${escapeHtml(label)}</td>
      <td style="padding:9px 0 9px 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:22px;color:#141414;">${value}</td>
    </tr>`
}

function button(href, label, accent = false) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;margin:0 8px 8px 0;">
      <tr>
        <td style="background:${accent ? '#d5ff55' : '#141414'};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 22px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:500;line-height:1;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;color:${accent ? '#141414' : '#f4f3ef'};">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`
}

function htmlFor(kind, booking) {
  const copy = CONTENT[kind]
  const date = formatDate(booking.start, booking.timeZone)
  const time = `${formatTime(booking.start, booking.timeZone)} – ${formatTime(booking.end, booking.timeZone)}`
  const zone = `${booking.timeZone} (${zoneLabel(booking.start, booking.timeZone)})`
  const meet = booking.meetingUrl
    ? detailRow('Google Meet', `<a href="${escapeHtml(booking.meetingUrl)}" style="color:#141414;text-decoration:underline;">Join the meeting</a>`)
    : detailRow('Joining details', 'The Google Meet link will be added to your calendar invitation. If it is missing, reply to this email and we will send it.')
  const calendar = addToCalendarUrl({
    start: booking.start,
    end: booking.end,
    title: SCHEDULE_EVENT.title,
    description: `Meeting purpose: ${booking.purpose || 'Not specified'}\nReference: ${booking.reference}`,
    location: booking.meetingUrl || SCHEDULE_EVENT.location,
    meetingUrl: booking.meetingUrl,
  })

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#e9e9e3;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e9e9e3;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#f4f3ef;">
            <tr>
              <td style="padding:28px 40px;background:#141414;">
                <img src="${LOGO_URL}" width="150" alt="${escapeHtml(COMPANY.legalName)}" style="display:block;max-width:150px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:44px 40px 12px 40px;">
                <p style="margin:0 0 14px;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#66665f;">${escapeHtml(copy.eyebrow)}</p>
                <h1 style="margin:0;font-family:'Space Grotesk',Arial,sans-serif;font-size:34px;line-height:1.08;letter-spacing:-0.02em;font-weight:500;color:#141414;">${escapeHtml(copy.heading)}</h1>
                <p style="margin:20px 0 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:24px;color:#4f4f49;">${escapeHtml(copy.intro(booking))}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(20,20,20,0.14);border-bottom:1px solid rgba(20,20,20,0.14);">
                  ${detailRow('Name', escapeHtml(booking.name))}
                  ${booking.company ? detailRow('Company', escapeHtml(booking.company)) : ''}
                  ${detailRow('Date', escapeHtml(date))}
                  ${detailRow('Time', escapeHtml(time))}
                  ${detailRow('Timezone', escapeHtml(zone))}
                  ${detailRow('Duration', `${SCHEDULE_EVENT.durationMinutes} minutes`)}
                  ${detailRow('Reference', escapeHtml(booking.reference))}
                  ${booking.purpose ? detailRow('Purpose', escapeHtml(booking.purpose)) : ''}
                  ${meet}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 30px 40px;">
                ${button(calendar, 'Add to calendar', true)}
                ${booking.meetingUrl ? button(booking.meetingUrl, 'Open Google Meet') : ''}
                ${booking.manageToken ? button(manageUrl(booking.manageToken), 'Reschedule or cancel') : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px;background:#141414;">
                <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:21px;color:#f4f3ef;">
                  Questions? Write to <a href="${escapeHtml(COMPANY.emailHref)}" style="color:#d5ff55;text-decoration:underline;">${escapeHtml(COMPANY.email)}</a>
                  or visit <a href="${escapeHtml(COMPANY.website)}" style="color:#d5ff55;text-decoration:underline;">afghanfutian.com</a>.
                </p>
                <p style="margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:18px;letter-spacing:0.08em;text-transform:uppercase;color:#a8a8a0;">
                  ${escapeHtml(COMPANY.legalName)} · Yiwu, China · Kabul, Afghanistan
                </p>
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
    `Date: ${formatDate(booking.start, booking.timeZone)}`,
    `Time: ${formatTime(booking.start, booking.timeZone)} – ${formatTime(booking.end, booking.timeZone)}`,
    `Timezone: ${booking.timeZone} (${zoneLabel(booking.start, booking.timeZone)})`,
    `Duration: ${SCHEDULE_EVENT.durationMinutes} minutes`,
    `Reference: ${booking.reference}`,
    booking.purpose ? `Purpose: ${booking.purpose}` : '',
    `Google Meet: ${booking.meetingUrl || 'Added to your calendar invitation'}`,
    `Add to calendar: ${addToCalendarUrl({
      start: booking.start,
      end: booking.end,
      title: SCHEDULE_EVENT.title,
      description: `Reference: ${booking.reference}`,
      location: booking.meetingUrl || SCHEDULE_EVENT.location,
      meetingUrl: booking.meetingUrl,
    })}`,
    booking.manageToken ? `Reschedule or cancel: ${manageUrl(booking.manageToken)}` : '',
    '',
    `${COMPANY.legalName}`,
    `${COMPANY.email} · ${COMPANY.website}`,
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

/** A standards-compliant VEVENT for Resend attachments. */
export function calendarAttachment(booking) {
  const stamp = (value) => new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const escapeIcs = (value) =>
    String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')

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
    `DESCRIPTION:${escapeIcs(`Reference: ${booking.reference}\nPurpose: ${booking.purpose || 'Not specified'}`)}`,
    `LOCATION:${escapeIcs(booking.meetingUrl || SCHEDULE_EVENT.location)}`,
    `URL:${escapeIcs(booking.meetingUrl || siteUrl('/schedule'))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return {
    filename: 'afghan-futian-meeting.ics',
    content: Buffer.from(ics, 'utf8').toString('base64'),
  }
}

export default schedulingEmail
