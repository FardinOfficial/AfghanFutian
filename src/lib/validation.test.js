import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildMailtoFallback, validateField, validateForm } from './validation.js'

/**
 * Unit tests for the enquiry validation rules.
 *
 * Run with `npm test`. These use Node's built-in test runner, so the project
 * gains no test framework for what are, deliberately, pure functions.
 *
 * The field descriptors below are declared here rather than imported from
 * `src/data/contact.js`. That module uses bundler-style extensionless imports,
 * which Node's ESM resolver refuses — and, more importantly, these tests are
 * about the *rules*, not the copy, so a local fixture is the correct boundary.
 */

const NAME = {
  name: 'name',
  label: 'Full name',
  type: 'text',
  required: true,
  maxLength: 80,
  minLength: 2,
  requiredMessage: 'Please tell us who we are speaking with.',
  minLengthMessage: 'Please enter your full name.',
}

const COMPANY = { name: 'company', label: 'Company', type: 'text', maxLength: 120 }
const EMAIL = {
  name: 'email',
  label: 'Email',
  type: 'email',
  required: true,
  maxLength: 254,
  requiredMessage: 'We need an address to reply to.',
}
const PHONE = { name: 'phone', label: 'Telephone', type: 'tel', maxLength: 40 }
const SERVICE = {
  name: 'service',
  label: 'Service',
  type: 'select',
  required: true,
  options: ['Sourcing', 'Supply Chain', 'Logistics'],
}
const MESSAGE = {
  name: 'message',
  label: 'Message',
  type: 'textarea',
  required: true,
  minLength: 20,
  maxLength: 2000,
}

const FIELDS = [NAME, COMPANY, EMAIL, PHONE, SERVICE, MESSAGE]

describe('validateField', () => {
  it('requires a value when the field is required', () => {
    assert.equal(validateField(NAME, ''), NAME.requiredMessage)
  })

  it('treats a whitespace-only value as empty', () => {
    assert.equal(validateField(NAME, '   '), NAME.requiredMessage)
    assert.equal(validateField(EMAIL, '\t\n '), EMAIL.requiredMessage)
  })

  it('falls back to a default message when a required field declares none', () => {
    const bare = { name: 'x', label: 'X', type: 'text', required: true }
    assert.equal(validateField(bare, ''), 'This detail is needed before we can reply.')
  })

  it('accepts an empty value for an optional field', () => {
    assert.equal(validateField(COMPANY, ''), '')
    assert.equal(validateField(COMPANY, '   '), '')
  })

  it('tolerates a missing value entirely', () => {
    assert.equal(validateField(NAME, undefined), NAME.requiredMessage)
    assert.equal(validateField(COMPANY, undefined), '')
    assert.equal(validateField(COMPANY, null), '')
    assert.equal(validateField(COMPANY, 42), '')
  })

  it('rejects a value longer than maxLength, counting the untrimmed value', () => {
    assert.equal(validateField(COMPANY, 'a'.repeat(121)), 'Please keep this under 120 characters.')
    assert.equal(validateField(COMPANY, 'a'.repeat(120)), '')

    // maxLength is measured on the raw value, so surrounding space counts —
    // matching what the browser's own maxlength attribute would enforce.
    assert.equal(
      validateField(COMPANY, `  ${'a'.repeat(120)}  `),
      'Please keep this under 120 characters.',
    )
  })

  it('enforces minLength on the trimmed value and uses the declared message', () => {
    assert.equal(validateField(NAME, 'A'), NAME.minLengthMessage)
    assert.equal(validateField(NAME, '  Ab  '), '')
  })

  it('falls back to a default minLength message when none is declared', () => {
    const bare = { name: 'x', label: 'X', type: 'text', minLength: 5 }
    assert.equal(validateField(bare, 'abc'), 'Please use at least 5 characters.')
  })

  it('accepts the email addresses people actually have', () => {
    for (const address of [
      'a@b.co',
      'first.last@example.com',
      'user+tag@sub.domain.co.uk',
      "o'brien@example.org",
    ]) {
      assert.equal(validateField(EMAIL, address), '', `expected ${address} to be accepted`)
    }
  })

  it('rejects values that are not email addresses', () => {
    const expected = 'Check the email address and try again.'
    for (const address of ['nope', 'a@b', 'a@b.c', 'a b@c.com', 'a@b .com', '@example.com']) {
      assert.equal(validateField(EMAIL, address), expected, `expected ${address} to be rejected`)
    }
  })

  it('accepts phone numbers with the punctuation people type', () => {
    for (const number of ['+44 20 7946 0958', '(020) 7946 0958', '020-7946-0958', '123456']) {
      assert.equal(validateField(PHONE, number), '', `expected ${number} to be accepted`)
    }
  })

  it('rejects phone numbers that are malformed or too short to dial', () => {
    const expected = 'Use digits only, with the country code if possible.'
    for (const number of ['call me', '12345', '+44 20', 'telephone']) {
      assert.equal(validateField(PHONE, number), expected, `expected ${number} to be rejected`)
    }
  })

  it('only accepts a value that is one of the declared options', () => {
    assert.equal(validateField(SERVICE, 'Sourcing'), '')
    assert.equal(validateField(SERVICE, 'Something else'), 'Choose one of the listed options.')
    // Options are matched exactly; the client never sends a free-text service.
    assert.equal(validateField(SERVICE, 'sourcing'), 'Choose one of the listed options.')
  })
})

describe('validateForm', () => {
  it('reports every invalid field, not just the first', () => {
    const { errors, valid } = validateForm(FIELDS, {})
    assert.equal(valid, false)
    assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name', 'service'])
    assert.ok(!('company' in errors))
    assert.ok(!('phone' in errors))
  })

  it('names the first invalid field in declaration order', () => {
    assert.equal(validateForm(FIELDS, {}).firstInvalid, 'name')
    assert.equal(validateForm(FIELDS, { name: 'Amina' }).firstInvalid, 'email')
    assert.equal(
      validateForm(FIELDS, { name: 'Amina', email: 'a@b.co' }).firstInvalid,
      'service',
    )
  })

  it('accepts a complete enquiry', () => {
    const values = {
      name: 'Amina Rahimi',
      company: 'Northwind',
      email: 'amina@example.com',
      phone: '+44 20 7946 0958',
      service: 'Logistics',
      message: 'We need help moving a container of goods to Karachi next quarter.',
    }
    const result = validateForm(FIELDS, values)
    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, {})
    assert.equal(result.firstInvalid, null)
  })

  it('ignores fields it was not given', () => {
    const result = validateForm([COMPANY], { somethingElse: 'value' })
    assert.equal(result.valid, true)
  })
})

describe('buildMailtoFallback', () => {
  const fields = [
    { name: 'name', label: 'Full name' },
    { name: 'company', label: 'Company' },
    { name: 'service', label: 'Service' },
    { name: 'message', label: 'Message' },
  ]

  it('addresses the recipient and keeps only the fields that were filled in', () => {
    const href = buildMailtoFallback(
      fields,
      { name: 'Amina', company: '', service: 'Sourcing', message: 'Hello' },
      'hello@example.com',
    )

    assert.ok(href.startsWith('mailto:hello@example.com?'))

    const query = new URLSearchParams(href.slice(href.indexOf('?') + 1))
    const body = query.get('body')

    assert.ok(body.includes('Full name: Amina'))
    assert.ok(body.includes('Service: Sourcing'))
    assert.ok(body.includes('Message: Hello'))
    assert.ok(!body.includes('Company:'), 'empty fields must be left out entirely')
  })

  it('names the service in the subject when one was chosen', () => {
    const href = buildMailtoFallback(fields, { service: 'Logistics' }, 'hello@example.com')
    const query = new URLSearchParams(href.slice(href.indexOf('?') + 1))
    assert.equal(query.get('subject'), 'Enquiry — Logistics')
  })

  it('falls back to a generic subject when no service was chosen', () => {
    const href = buildMailtoFallback(fields, {}, 'hello@example.com')
    const query = new URLSearchParams(href.slice(href.indexOf('?') + 1))
    assert.equal(query.get('subject'), 'Enquiry — Afghan Futian')
  })

  it('uses a supplied translator for the fallback subject and footer', () => {
    const translations = {
      'Enquiry — {{service}}': 'درخواست — {{service}}',
      'Enquiry — Afghan Futian': 'درخواست — افغان فوتین',
      'Sent from the Afghan Futian website.': 'ارسالشده از وبسایت افغان فوتین.',
    }
    const translate = (key, values = {}) =>
      (translations[key] ?? key).replace(/{{(\w+)}}/g, (match, name) => values[name] ?? match)

    const href = buildMailtoFallback(
      fields,
      { service: 'Product sourcing', message: 'Hello' },
      'hello@example.com',
      translate,
    )
    const query = new URLSearchParams(href.slice(href.indexOf('?') + 1))

    assert.equal(query.get('subject'), 'درخواست — Product sourcing')
    assert.ok(query.get('body').includes('ارسالشده از وبسایت افغان فوتین.'))
  })

  it('survives values containing characters that must be escaped', () => {
    const message = 'Terms & conditions? 50% off — see "the note"'
    const href = buildMailtoFallback(fields, { message }, 'hello@example.com')
    const query = new URLSearchParams(href.slice(href.indexOf('?') + 1))

    assert.ok(query.get('body').includes(message))
    // The href itself must remain a single, unbroken URL.
    assert.ok(!href.includes('\n'))
    assert.ok(!href.includes(' '))
  })
})
