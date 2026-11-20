import assert from 'node:assert/strict'
import { test } from 'node:test'

import { calendarAttachment, schedulingEmail } from './schedulingEmail.js'
import { toBookingView } from './schedulingServer.js'

const booking = {
  uid: 'locale_uid_123',
  reference: 'LOCALEUI',
  name: 'Amina Rahimi',
  email: 'amina@example.com',
  company: 'Rahimi Trading',
  phone: '+93 700 000 000',
  purpose: '<script>alert(1)</script> Sourcing discussion',
  timeZone: 'Asia/Kabul',
  start: '2026-12-01T10:00:00.000Z',
  end: '2026-12-01T10:30:00.000Z',
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
  manageToken: 'signed.token',
}

const KINDS = ['confirmation', 'notification', 'reminder', 'cancellation', 'reschedule']

const ENGLISH_SUBJECTS = {
  confirmation: 'Meeting confirmed — Afghan Futian Trading Company — Meeting',
  notification: 'New meeting booked — Afghan Futian Trading Company — Meeting',
  reminder: 'Reminder: Afghan Futian Trading Company — Meeting',
  cancellation: 'Meeting cancelled — Afghan Futian Trading Company — Meeting',
  reschedule: 'Meeting rescheduled — Afghan Futian Trading Company — Meeting',
}

test('English scheduling emails keep their current subjects and branded structure', () => {
  for (const kind of KINDS) {
    const message = schedulingEmail(kind, booking)
    assert.equal(message.subject, ENGLISH_SUBJECTS[kind])
    assert.match(message.html, /<html lang="en" dir="ltr">/)
    assert.match(message.html, /<table role="presentation"/)
    assert.match(message.html, /logo-mark-light\.png/)
    assert.match(message.html, /#d5ff55/)
    assert.match(message.html, /Afghan Futian Trading Company · Yiwu, China · Kabul, Afghanistan/)
    assert.match(message.html, /Name/)
    assert.match(message.text, /Name: Amina Rahimi/)
    assert.match(message.text, /Duration: 30 minutes/)
  }

  const confirmation = schedulingEmail('confirmation', booking)
  assert.match(
    confirmation.text,
    /Thank you, Amina Rahimi of Rahimi Trading\. Your meeting with Afghan Futian Trading Company is confirmed\./,
  )
  assert.match(confirmation.html, /&lt;script&gt;/)
  assert.doesNotMatch(confirmation.html, /<script>/)
  assert.match(confirmation.text, /Add to calendar: https:\/\/calendar\.google\.com/)
  assert.match(confirmation.text, /Reschedule or cancel \(private signed link\): https:\/\/afghanfutian\.com/)
})

test('Pashto emails translate the subject, heading and labels and render RTL', () => {
  const message = schedulingEmail('confirmation', { ...booking, locale: 'ps' })
  assert.equal(message.subject, 'د ناستې تایید — Afghan Futian Trading Company — ناسته')
  assert.match(message.html, /<html lang="ps" dir="rtl">/)
  assert.ok((message.html.match(/dir="rtl"/g) ?? []).length >= 3, 'html and content wrapper must be RTL')
  assert.match(message.html, /ستاسو ناسته ټاکل شوې ده\./)
  assert.match(message.html, /نوم/)
  assert.match(message.html, /نیټه/)
  assert.match(message.html, /د Google Meet سره یوځای شئ/)
  assert.match(message.text, /ستاسو ناسته ټاکل شوې ده\./)
  assert.match(message.text, /نوم: Amina Rahimi/)
  assert.match(message.text, /30 دقیقې/)

  const reminder = schedulingEmail('reminder', { ...booking, locale: 'ps' })
  assert.equal(reminder.subject, 'یادونه: Afghan Futian Trading Company — ناسته')
  assert.match(reminder.text, /ستاسو ناسته نږدې ده\./)
})

test('Dari emails translate the subject, heading and labels and render RTL', () => {
  const message = schedulingEmail('confirmation', { ...booking, locale: 'fa-AF' })
  assert.equal(message.subject, 'ملاقات تأیید شد — Afghan Futian Trading Company — ملاقات')
  assert.match(message.html, /<html lang="fa-AF" dir="rtl">/)
  assert.match(message.html, /ملاقات شما تعیین شده است\./)
  assert.match(message.html, /نام/)
  assert.match(message.html, /تاریخ/)
  assert.match(message.text, /نام: Amina Rahimi/)
  assert.match(message.text, /30 دقیقه/)

  const cancellation = schedulingEmail('cancellation', { ...booking, locale: 'fa-AF' })
  assert.equal(cancellation.subject, 'ملاقات لغو شد — Afghan Futian Trading Company — ملاقات')
  assert.match(cancellation.text, /ملاقات لغو شده است\./)
})

test('locale is read from metadata, top-level locale wins, and unknown locales fall back to English', () => {
  const fromMetadata = schedulingEmail('confirmation', {
    ...booking,
    metadata: { locale: 'ps-AF' },
  })
  assert.equal(fromMetadata.subject, 'د ناستې تایید — Afghan Futian Trading Company — ناسته')
  assert.match(fromMetadata.html, /<html lang="ps" dir="rtl">/)

  const both = schedulingEmail('confirmation', {
    ...booking,
    locale: 'fa',
    metadata: { locale: 'ps' },
  })
  assert.equal(both.subject, 'ملاقات تأیید شد — Afghan Futian Trading Company — ملاقات')
  assert.match(both.html, /<html lang="fa-AF" dir="rtl">/)

  const unknown = schedulingEmail('confirmation', { ...booking, locale: 'zz-ZZ' })
  assert.equal(unknown.subject, ENGLISH_SUBJECTS.confirmation)
  assert.match(unknown.html, /<html lang="en" dir="ltr">/)
})

test('all placeholders are filled in every locale', () => {
  for (const locale of [undefined, 'ps', 'fa-AF']) {
    for (const kind of KINDS) {
      const message = schedulingEmail(kind, { ...booking, locale })
      for (const output of [message.subject, message.html, message.text]) {
        assert.doesNotMatch(output, /\{\{\w+\}\}/)
      }
      assert.ok(message.subject.includes('Afghan Futian Trading Company'))
      assert.ok(message.text.includes(booking.reference))
    }
  }
})

test('calendar attachments use the same localized description labels', () => {
  const english = Buffer.from(calendarAttachment(booking).content, 'base64').toString('utf8')
  assert.match(english, /DESCRIPTION:Reference: LOCALEUI/)

  const pashto = Buffer.from(calendarAttachment({ ...booking, locale: 'ps' }).content, 'base64').toString('utf8')
  const unfolded = pashto.replace(/\r\n /g, '')
  assert.match(unfolded, /DESCRIPTION:حواله: LOCALEUI/)
  assert.match(unfolded, /یادښتونه:/)
  assert.match(unfolded, /یوځای کېدل: https:\/\/meet\.google\.com/)
  assert.ok(
    pashto.split('\r\n').every((line) => Buffer.byteLength(line, 'utf8') <= 75),
    'localized ICS lines must still be RFC 5545 compliant',
  )
})

test('toBookingView exposes the provider locale without dropping its other fields', () => {
  const view = toBookingView({
    uid: 'locale_uid_123',
    start: booking.start,
    metadata: { locale: 'ps', source: 'embed' },
  })
  assert.equal(view.locale, 'ps')
  assert.equal(view.source, 'embed')
  assert.equal(view.reference, 'LOCALE_U')
  assert.equal(view.uid, 'locale_uid_123')

  assert.equal(toBookingView({ locale: 'fa-AF' }).locale, 'fa-AF')
  assert.equal(toBookingView({}).locale, '')
})
