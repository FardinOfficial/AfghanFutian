/**
 * Server-side access to the same translation dictionaries used by the browser.
 * Node ESM JSON imports require an explicit type attribute; Vite handles the
 * attribute-free imports in `src/i18n/index.js`.
 */

import en from './locales/en/email.json' with { type: 'json' }
import ps from './locales/ps/email.json' with { type: 'json' }
import fa from './locales/fa-AF/email.json' with { type: 'json' }

const EMAIL_COPY = { en, ps, 'fa-AF': fa }

/** Normalise a browser locale id to one of the supported dictionary ids. */
export function emailLocale(locale) {
  const value = String(locale ?? '')
  if (value === 'ps' || value.startsWith('ps-')) return 'ps'
  if (value === 'fa-AF' || value.startsWith('fa')) return 'fa-AF'
  return 'en'
}

export function emailCopy(locale) {
  return EMAIL_COPY[emailLocale(locale)] ?? en
}

export function emailDirection(locale) {
  return emailLocale(locale) === 'en' ? 'ltr' : 'rtl'
}

/** Replace `{{name}}` placeholders with escaped, caller-supplied values. */
export function fill(template, values = {}) {
  return String(template ?? '').replace(/\{\{(\w+)\}\}/g, (match, key) =>
    values[key] === undefined || values[key] === null || values[key] === '' ? '' : String(values[key]),
  )
}

export default emailCopy
