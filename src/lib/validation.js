/**
 * CONTACT FORM VALIDATION
 * ============================================================================
 * Pure functions, no React and no DOM. That matters for two reasons:
 *
 *   1. The same rules are reused by the server function in `api/contact.js`, so
 *      client and server never disagree about what a valid enquiry is.
 *   2. They are trivially testable without mounting a component.
 *
 * Message style: every message tells the reader what to do, in the site's voice.
 * There is no "Invalid input", no "This field is required", and no shouting.
 */

import { FIELD_ERROR_CODES } from './errorCodes.js'

/** Deliberately permissive. Rejecting a real address is worse than accepting a fake one. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Digits, spaces and the punctuation people actually type in phone numbers. */
const PHONE_ALLOWED = /^[+()\d][\d\s()./-]*$/

const countDigits = (value) => (value.match(/\d/g) ?? []).length

/**
 * Validate one field.
 *
 * @param {object} field  entry from `CONTACT_FORM_FIELDS`
 * @param {string} value
 * @returns {string} an error message, or `''` when the value is acceptable
 */
export function validateField(field, value) {
  const raw = typeof value === 'string' ? value : ''
  const trimmed = raw.trim()

  if (field.required && !trimmed) {
    return field.requiredMessage ?? 'This detail is needed before we can reply.'
  }

  // Everything below only applies to values that were actually supplied.
  if (!trimmed) return ''

  if (field.maxLength && raw.length > field.maxLength) {
    return `Please keep this under ${field.maxLength} characters.`
  }

  if (field.minLength && trimmed.length < field.minLength) {
    return field.minLengthMessage ?? `Please use at least ${field.minLength} characters.`
  }

  if (field.type === 'email' && !EMAIL_PATTERN.test(trimmed)) {
    return 'Check the email address and try again.'
  }

  if (field.type === 'tel') {
    if (!PHONE_ALLOWED.test(trimmed) || countDigits(trimmed) < 6) {
      return 'Use digits only, with the country code if possible.'
    }
  }

  if (field.options && !optionValues(field).includes(trimmed)) {
    return 'Choose one of the listed options.'
  }

  return ''
}

/** Select options may be plain strings or `{ value, label }` objects. */
function optionValues(field) {
  return (field.options ?? []).map((option) =>
    typeof option === 'string' ? option : option?.value,
  )
}

/**
 * The same rules as `validateField`, expressed as stable codes for the API.
 * Kept separate so existing callers keep receiving human-readable messages.
 */
export function validateFieldCode(field, value) {
  const raw = typeof value === 'string' ? value : ''
  const trimmed = raw.trim()

  if (field.required && !trimmed) return FIELD_ERROR_CODES.required
  if (!trimmed) return ''
  if (field.maxLength && raw.length > field.maxLength) return FIELD_ERROR_CODES.maxLength
  if (field.minLength && trimmed.length < field.minLength) return FIELD_ERROR_CODES.minLength
  if (field.type === 'email' && !EMAIL_PATTERN.test(trimmed)) return FIELD_ERROR_CODES.email
  if (field.type === 'tel' && (!PHONE_ALLOWED.test(trimmed) || countDigits(trimmed) < 6)) {
    return FIELD_ERROR_CODES.phone
  }
  if (field.options && !optionValues(field).includes(trimmed)) return FIELD_ERROR_CODES.option
  return ''
}

/** Field-level validation with codes, used by the server endpoint. */
export function validateFormCodes(fields, values) {
  const errors = {}

  for (const field of fields) {
    const code = validateFieldCode(field, values[field.name])
    if (code) errors[field.name] = code
  }

  const firstInvalid = fields.find((field) => errors[field.name])?.name ?? null
  return { errors, valid: Object.keys(errors).length === 0, firstInvalid }
}

/**
 * Validate every field.
 *
 * @param {Array} fields
 * @param {Record<string, string>} values
 * @returns {{ errors: Record<string, string>, valid: boolean, firstInvalid: string | null }}
 */
export function validateForm(fields, values) {
  const errors = {}

  for (const field of fields) {
    const message = validateField(field, values[field.name])
    if (message) errors[field.name] = message
  }

  const firstInvalid = fields.find((field) => errors[field.name])?.name ?? null

  return { errors, valid: Object.keys(errors).length === 0, firstInvalid }
}

/**
 * A `mailto:` fallback built from whatever the reader has typed.
 *
 * Used when submission fails, so an enquiry is never lost to a broken endpoint.
 * The body is plain text and line-broken, because that is what every mail client
 * renders reliably.
 */
export function buildMailtoFallback(fields, values, to, translate = defaultTranslate) {
  const lines = fields
    .map((field) => {
      const value = (values[field.name] ?? '').trim()
      if (!value) return null
      return `${field.label}: ${value}`
    })
    .filter(Boolean)

  const subject = values.service
    ? translate('Enquiry — {{service}}', { service: values.service })
    : translate('Enquiry — Afghan Futian')

  const body = [...lines, '', '—', translate('Sent from the Afghan Futian website.')].join('\n')

  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function defaultTranslate(key, values = {}) {
  return key.replace(/{{(\w+)}}/g, (match, name) => values[name] ?? match)
}

export default { validateField, validateForm, buildMailtoFallback }
