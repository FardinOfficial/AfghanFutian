// The explicit `.js` extension is deliberate: this module is imported by the
// server function in `api/contact.js`, and plain Node ESM requires it, whereas
// Vite accepts either form.
import { SERVICE_OPTIONS } from './serviceOptions.js'

/**
 * CONTACT FORM MODEL
 * ============================================================================
 * Field definitions live here so the form, the validation rules and (later) the
 * server-side schema can all be generated from one description. Adding a field is
 * a one-object change.
 *
 * Field shape
 *   name           — key in the values object, and in the submitted payload
 *   label          — visible label; also used in the `mailto:` fallback
 *   type           — text | email | tel | textarea | select
 *   required       — enforced on the client and again on the server
 *   autoComplete   — so browsers fill these correctly rather than guessing
 *   hint           — persistent helper text, wired up via `aria-describedby`
 *   maxLength      — mirrors the server's limit
 *   minLength      — minimum *after trimming*, for free-text fields
 *
 * Copy rules, same as everywhere else on the site: no promised response times,
 * no invented service guarantees, and no field that collects data we have not
 * said we need.
 */

export const CONTACT_FORM_FIELDS = [
  {
    name: 'name',
    label: 'Your name',
    type: 'text',
    required: true,
    autoComplete: 'name',
    maxLength: 80,
    minLength: 2,
    requiredMessage: 'Please enter your name.',
    minLengthMessage: 'Please use your full name.',
  },
  {
    name: 'company',
    label: 'Company',
    type: 'text',
    autoComplete: 'organization',
    maxLength: 120,
    hint: 'Optional. It helps us understand the enquiry.',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    autoComplete: 'email',
    inputMode: 'email',
    maxLength: 254,
    requiredMessage: 'We need an email address to reply to.',
  },
  {
    name: 'phone',
    label: 'Phone number',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'tel',
    maxLength: 40,
    hint: 'Optional. Include the country code if available.',
  },
  {
    name: 'country',
    label: 'Country',
    type: 'text',
    autoComplete: 'country-name',
    maxLength: 80,
    hint: 'Optional. Where the goods should arrive, if known.',
  },
  {
    name: 'service',
    label: 'What do you need?',
    type: 'select',
    required: true,
    options: SERVICE_OPTIONS,
    requiredMessage: 'Please choose the closest option.',
    placeholder: 'Choose the closest option',
  },
  {
    name: 'message',
    label: 'Your requirement',
    type: 'textarea',
    required: true,
    maxLength: 2000,
    minLength: 20,
    rows: 7,
    requiredMessage: 'Please describe what you need.',
    minLengthMessage: 'Please add a little more detail — about 20 characters.',
    hint: 'Include the product, quantity, target price, delivery location and timeline.',
  },
]

export const CONTACT_FORM_COPY = {
  submitLabel: 'Send enquiry',
  submittingLabel: 'Sending',

  /** Shown at the top of the form after a failed submit, and focused. */
  summaryTitle: 'Check these details.',
  summaryIntro: 'Nothing has been sent yet. Please correct:',

  successTitle: 'Enquiry received.',
  successBody:
    'Thank you. We have your requirement and will reply to the email address you gave. If we cannot arrange it, we will say so.',
  successAgain: 'Send another enquiry',

  errorTitle: 'We could not send it.',
  errorBody:
    'Your answers are still here. Try again or use the email link — nothing you typed will be lost.',

  /** The fallback link label when submission fails. */
  fallbackLabel: 'Send it by email',
  retryLabel: 'Try again',

  honeypotLabel: 'Leave this field empty',

  /**
   * A short, honest statement about what happens to the data. It says what we do
   * with it, and does not promise a policy document that does not exist yet.
   */
  dataNote:
    'We use these details only to answer your enquiry. They are not added to a mailing list.',
}

export default { CONTACT_FORM_FIELDS, CONTACT_FORM_COPY }
