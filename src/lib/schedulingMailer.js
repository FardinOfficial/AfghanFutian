import { COMPANY } from '../data/company.js'
import { calendarAttachment, schedulingEmail } from './schedulingEmail.js'
import { ProviderError, resendSend } from './schedulingServer.js'

/**
 * SERVER-ONLY email dispatch for scheduling.
 *
 * Every send carries a deterministic Resend idempotency key (24-hour replay
 * window) so a retried request cannot produce a second customer email. Mail
 * failures are returned to the caller rather than thrown away: a reservation
 * that already exists in Cal.com cannot be rolled back, so the visitor must be
 * told honestly that the confirmation email needs attention.
 */

const companyInbox = () => process.env.CONTACT_TO_EMAIL?.trim() || COMPANY.email

/**
 * Cal.com already sends attendee confirmations, reminders and change notices.
 * Its guest cancellation/reschedule settings are organisation-only, and on the
 * Free plan a substitute workflow email cannot be customised. Sending our own
 * branded copy as well would therefore duplicate provider mail on the current
 * account. Guest emails are enabled only after the operator has explicitly
 * confirmed the provider side is configured (see README). The company
 * notification is always ours: host notifications can be switched off on every
 * plan, and no duplicate reaches the booker.
 */
export const attendeeEmailsEnabled = () =>
  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS === 'true'

export async function sendBookingEmail(kind, booking, options = {}) {
  const { to, idempotencyKey, includeCalendar = false } = options
  const message = schedulingEmail(kind, booking)

  const id = await resendSend(
    {
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(includeCalendar ? { attachments: [calendarAttachment(booking)] } : {}),
    },
    idempotencyKey,
  )
  return id
}

/** Branded confirmation to the booker (when enabled) plus our company notice. */
export async function sendBookingConfirmation(booking) {
  const enabled = attendeeEmailsEnabled()
  const jobs = [
    sendBookingEmail('notification', booking, {
      to: companyInbox(),
      idempotencyKey: `booking-notification/${booking.uid}`,
    }),
  ]
  if (enabled) {
    jobs.push(
      sendBookingEmail('confirmation', booking, {
        to: booking.email,
        idempotencyKey: `booking-confirmation/${booking.uid}`,
        includeCalendar: true,
      }),
    )
  }

  const results = await Promise.allSettled(jobs)
  return {
    notification: results[0].status === 'fulfilled' ? results[0].value : null,
    confirmation: enabled && results[1]?.status === 'fulfilled' ? results[1].value : null,
    failed: results.filter((result) => result.status === 'rejected').length,
    attendeeEmailsEnabled: enabled,
  }
}

export async function sendCancellationNotice(booking) {
  if (!attendeeEmailsEnabled()) return null
  return sendBookingEmail('cancellation', booking, {
    to: booking.email,
    idempotencyKey: `booking-cancellation/${booking.uid}`,
  })
}

export async function sendRescheduleNotice(booking) {
  if (!attendeeEmailsEnabled()) return null
  return sendBookingEmail('reschedule', booking, {
    to: booking.email,
    idempotencyKey: `booking-reschedule/${booking.uid}/${booking.start}`,
  })
}

const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000

function reminderMessage(booking) {
  const message = schedulingEmail('reminder', booking)
  return { to: booking.email, subject: message.subject, html: message.html, text: message.text }
}

export async function sendReminder(booking) {
  if (!attendeeEmailsEnabled()) return null
  return sendBookingEmail('reminder', booking, {
    to: booking.email,
    idempotencyKey: `booking-reminder/${booking.uid}/${booking.start}`,
  })
}

/**
 * Register the 24-hour reminder with Resend at booking time. Resend supports
 * `scheduledAt` up to 30 days ahead, so no cron job or database is required.
 * Returns null when the meeting is too soon or too far away to schedule.
 */
export async function scheduleReminder(booking) {
  if (!attendeeEmailsEnabled()) return null
  const start = Date.parse(booking.start)
  const sendAt = start - REMINDER_LEAD_MS
  if (!Number.isFinite(start) || sendAt <= Date.now() + 60_000) return null
  if (start - Date.now() > 30 * 24 * 60 * 60 * 1000) return null

  const key = `booking-reminder/${booking.uid}/${booking.start}`
  return resendSend({ ...reminderMessage(booking), scheduledAt: new Date(sendAt).toISOString() }, key)
}

/**
 * Best-effort cancellation of a scheduled reminder. Re-sending the identical
 * payload with the same idempotency key replays the original response — which
 * contains its Resend email id — without sending a second email. Resend keeps
 * idempotency keys for 24 hours, so this cannot retrieve ids for reminders
 * registered further in the past; that limitation is documented in the README.
 * A cron reconciliation endpoint remains available as the durable fallback.
 */
export async function cancelScheduledReminder(booking) {
  if (!attendeeEmailsEnabled()) return false
  if (!booking?.start || !booking?.uid || !booking?.email) return false
  try {
    const start = Date.parse(booking.start)
    if (!Number.isFinite(start) || start - Date.now() <= 0) return false
    const key = `booking-reminder/${booking.uid}/${booking.start}`
    const id = await resendSend(
      { ...reminderMessage(booking), scheduledAt: new Date(start - REMINDER_LEAD_MS).toISOString() },
      key,
    )
    if (!id) return false

    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) return false
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new ProviderError(response.status, 'reminder_cancel_failed')
    return true
  } catch {
    console.info('[schedule] scheduled reminder could not be cancelled')
    return false
  }
}

export default {
  attendeeEmailsEnabled,
  sendBookingEmail,
  sendBookingConfirmation,
  sendCancellationNotice,
  sendRescheduleNotice,
  sendReminder,
  scheduleReminder,
  cancelScheduledReminder,
}
