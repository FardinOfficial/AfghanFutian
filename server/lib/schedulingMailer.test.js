import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import {
  attendeeEmailsEnabled,
  cancelScheduledReminder,
  scheduleReminder,
  sendBookingConfirmation,
} from './schedulingMailer.js'
import { schedulingEmail, calendarAttachment } from './schedulingEmail.js'

const START = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
const END = new Date(Date.parse(START) + 1_800_000).toISOString()

const booking = {
  uid: 'mailer_uid_123',
  reference: 'MAILERUI',
  name: 'Amina Rahimi',
  email: 'amina@example.com',
  company: 'Rahimi Trading',
  purpose: '<script>alert(1)</script> Sourcing discussion',
  timeZone: 'Asia/Kabul',
  start: START,
  end: END,
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
  manageToken: 'signed.token',
}

let realFetch

beforeEach(() => {
  realFetch = globalThis.fetch
  process.env.RESEND_API_KEY = 'test-resend-key'
  process.env.CONTACT_TO_EMAIL = 'company@example.com'
  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS = 'false'
})

afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.RESEND_API_KEY
  delete process.env.CONTACT_TO_EMAIL
  delete process.env.SCHEDULE_SEND_ATTENDEE_EMAILS
})

function stubMail(calls) {
  const replay = new Map()
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init, body: init.body ? JSON.parse(init.body) : undefined })
    const key = init.headers?.['Idempotency-Key']
    if (key && replay.has(key)) {
      const id = replay.get(key)
      return {
        ok: true,
        status: 201,
        json: async () => ({ id }),
        text: async () => JSON.stringify({ id }),
      }
    }
    const id = `resend_${calls.length}`
    if (key) replay.set(key, id)
    return {
      ok: true,
      status: 201,
      json: async () => ({ id }),
      text: async () => JSON.stringify({ id }),
    }
  }
}

test('branded templates carry plain text, official identity, calendar and manage links', () => {
  const message = schedulingEmail('confirmation', booking)
  assert.match(message.subject, /Meeting confirmed/)
  assert.match(message.html, /Afghan Futian Trading Company/)
  assert.match(message.html, /afghanfutian\.com\/schedule\/manage\?token=signed\.token/)
  assert.doesNotMatch(message.html, /<script>/)
  assert.match(message.html, /&lt;script&gt;/)
  assert.match(message.text, /Add to calendar: https:\/\/calendar\.google\.com/)
  assert.match(message.text, /Reschedule or cancel \(private signed link\): https:\/\/afghanfutian\.com/)
  assert.match(message.text, /\+86 147 5788 1420/)
  assert.match(message.text, /\+93 70 513 2426/)
  assert.match(message.html, /logo-mark-light\.png/)
  assert.match(message.html, /#12306b/)
  assert.doesNotMatch(message.html, /display:flex/)

  const attachment = calendarAttachment(booking)
  assert.equal(attachment.filename, 'afghan-futian-meeting.ics')
  const ics = Buffer.from(attachment.content, 'base64').toString('utf8')
  const unfolded = ics.replace(/\r\n /g, '')
  assert.match(ics, /\r\n /)
  assert.ok(
    ics.split('\r\n').every((line) => Buffer.byteLength(line, 'utf8') <= 75),
    'every ICS physical line must fit the RFC 5545 octet limit',
  )
  assert.match(unfolded, /ORGANIZER;CN=Afghan Futian Trading Company:mailto:contact@afghanfutian\.com/)
  assert.match(unfolded, /STATUS:CONFIRMED/)
  assert.doesNotMatch(unfolded, /schedule\/manage\?token=/)
  assert.match(unfolded, /PRODID:.*Afghan Futian Trading Company/)
  assert.match(unfolded, /BEGIN:VEVENT/)
  assert.match(unfolded, /meet\.google\.com/)
})

test('all five scheduling emails share the branded, client-compatible structure', () => {
  for (const kind of ['confirmation', 'notification', 'reminder', 'cancellation', 'reschedule']) {
    const message = schedulingEmail(kind, booking)
    assert.ok(message.subject.length > 0)
    assert.match(message.html, /logo-mark-light\.png/)
    assert.match(message.html, /<table role="presentation"/)
    assert.match(message.html, /#12306b/)
    assert.match(message.html, /afghanfutian\.com/)
    assert.match(message.text, /Google Meet: https:\/\/meet\.google\.com/)
    assert.match(message.text, /Add to calendar: https:\/\/calendar\.google\.com/)
    assert.match(message.text, /contact@afghanfutian\.com/)
  }
})

test('company notification is always ours; guest mail follows the explicit flag', async () => {
  assert.equal(attendeeEmailsEnabled(), false)
  const disabledCalls = []
  stubMail(disabledCalls)
  const disabled = await sendBookingConfirmation(booking)
  assert.equal(disabled.attendeeEmailsEnabled, false)
  assert.equal(disabled.confirmation, null)
  assert.equal(disabledCalls.length, 1)
  assert.equal(disabledCalls[0].body.to, 'company@example.com')

  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS = 'true'
  const enabledCalls = []
  stubMail(enabledCalls)
  const enabled = await sendBookingConfirmation(booking)
  assert.equal(enabled.attendeeEmailsEnabled, true)
  assert.ok(enabled.confirmation)
  assert.equal(enabledCalls.length, 2)
  const confirmation = enabledCalls.find((call) => call.body.to === 'amina@example.com')
  assert.ok(confirmation)
  assert.equal(confirmation.body.from, 'Afghan Futian <contact@afghanfutian.com>')
  assert.equal(confirmation.body.reply_to, 'contact@afghanfutian.com')
  assert.equal(confirmation.body.attachments[0].filename, 'afghan-futian-meeting.ics')
  assert.match(confirmation.init.headers['Idempotency-Key'], /^booking-confirmation\//)
})

test('reminders are scheduled 24 hours ahead with a stable idempotency key', async () => {
  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS = 'true'
  const calls = []
  stubMail(calls)

  const id = await scheduleReminder(booking)
  assert.equal(id, 'resend_1')
  assert.equal(calls.length, 1)
  const expected = Date.parse(START) - 24 * 60 * 60 * 1000
  assert.equal(calls[0].body.scheduledAt, new Date(expected).toISOString())
  assert.match(calls[0].init.headers['Idempotency-Key'], /^booking-reminder\//)
})

test('scheduled reminders can be cancelled without creating a second send', async () => {
  process.env.SCHEDULE_SEND_ATTENDEE_EMAILS = 'true'
  const calls = []
  stubMail(calls)

  const cancelled = await cancelScheduledReminder(booking)
  assert.equal(cancelled, true)
  assert.equal(calls.length, 2)
  assert.match(calls[1].url, /\/emails\/resend_1\/cancel$/)
})
