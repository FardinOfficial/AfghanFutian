import { SERVICE_OPTIONS } from './services'

/**
 * CONTACT FORM MODEL
 * ============================================================================
 * Field definitions live here so the form, the validation rules and (later) the
 * server-side schema can all be generated from one description. Adding a field is
 * a one-object change.
 *
 * Field shape
 *   name           — key in the values object, and the MongoDB field name
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
    label: 'Full name',
    type: 'text',
    required: true,
    autoComplete: 'name',
    maxLength: 80,
    minLength: 2,
    requiredMessage: 'Please tell us who we are speaking with.',
    minLengthMessage: 'Please enter your full name.',
  },
  {
    name: 'company',
    label: 'Company',
    type: 'text',
    autoComplete: 'organization',
    maxLength: 120,
    hint: 'Optional, but it helps us understand the context.',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    autoComplete: 'email',
    inputMode: 'email',
    maxLength: 254,
    requiredMessage: 'We need an address to reply to.',
  },
  {
    name: 'phone',
    label: 'Telephone',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'tel',
    maxLength: 40,
    hint: 'Optional. Include the country code if you can.',
  },
  {
    name: 'country',
    label: 'Country',
    type: 'text',
    autoComplete: 'country-name',
    maxLength: 80,
    hint: 'Optional. Where the goods must land, if that is already known.',
  },
  {
    name: 'service',
    label: 'Service of interest',
    type: 'select',
    required: true,
    options: SERVICE_OPTIONS,
    requiredMessage: 'Please choose the closest match.',
    placeholder: 'Select a service',
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
    minLengthMessage: 'A little more detail will help us reply properly — 20 characters or so.',
    hint: 'The product, quantities, target pricing, destination and timeline are the most useful things to include.',
  },
]

export const CONTACT_FORM_COPY = {
  submitLabel: 'Send Enquiry',
  submittingLabel: 'Sending',

  /** Shown at the top of the form after a failed submit, and focused. */
  summaryTitle: 'Some details need another look.',
  summaryIntro: 'Nothing has been sent yet. Please correct the following:',

  successTitle: 'Enquiry received.',
  successBody:
    'Thank you — your enquiry is with us. We will come back to you at the address you gave, and we will tell you plainly if what you need is outside what we can arrange.',
  successAgain: 'Send another enquiry',

  errorTitle: 'That did not send.',
  errorBody:
    'Your details are still in the form. You can try again, or send the same message by email instead — nothing you have written will be lost.',

  /** The fallback link label when submission fails. */
  fallbackLabel: 'Send it by email instead',
  retryLabel: 'Try again',

  honeypotLabel: 'Leave this field empty',

  /**
   * A short, honest statement about what happens to the data. It says what we do
   * with it, and does not promise a policy document that does not exist yet.
   */
  dataNote:
    'We use these details only to answer your enquiry. They are not sold, and not added to a mailing list.',
}

export default { CONTACT_FORM_FIELDS, CONTACT_FORM_COPY }
