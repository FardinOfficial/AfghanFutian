/**
 * Stable error codes shared by the browser, the server function and the UI.
 *
 * The server never sends prose: it sends one of these codes. The browser maps
 * the code to the English source string (which is also the i18next key) and
 * translates it into the visitor's language. This keeps client and server in
 * step without either side guessing from a localised sentence.
 */

/** Field-level validation codes. */
export const FIELD_ERROR_CODES = {
  required: 'required',
  maxLength: 'max-length',
  minLength: 'min-length',
  email: 'email',
  phone: 'phone',
  option: 'option',
}

/** English source strings for every stable code (also i18next keys). */
export const ERROR_MESSAGES = {
  required: 'This detail is needed before we can reply.',
  'max-length': 'Please keep this under {{count}} characters.',
  'min-length': 'Please use at least {{count}} characters.',
  email: 'Check the email address and try again.',
  phone: 'Use digits only, with the country code if possible.',
  option: 'Choose one of the listed options.',

  timeout: 'The request took too long to complete. Please try again.',
  network: 'We could not reach the server. Please check your connection and try again.',
  confirm: 'We could not confirm that your enquiry was sent. Please email us directly.',
  validation: 'Some details need another look.',
  'rate-limited': 'That is a few enquiries in quick succession. Please wait a moment and try again.',
  server: 'Something went wrong at our end. Please try again, or email us directly.',

  'method-not-allowed': 'Method not allowed.',
  'not-configured':
    'The email service is not configured on this deployment. Please email us directly in the meantime.',
  'too-large': 'That message is too large.',
  malformed: 'Malformed request body.',
  'server-rate-limited': 'Too many enquiries from this connection. Please try again shortly.',
  'mail-failed': 'We could not hand your enquiry to our mail service. Please email us directly.',
}

/**
 * Translate a stable code into the active language.
 * Unknown codes are passed through, so older deployments stay readable.
 */
export function messageForCode(code, t, options = {}) {
  const key = ERROR_MESSAGES[code] ?? (typeof code === 'string' ? code : ERROR_MESSAGES.server)
  return typeof t === 'function'
    ? t(key, { ns: ['common', 'contact'], ...options })
    : key
}

export default messageForCode
