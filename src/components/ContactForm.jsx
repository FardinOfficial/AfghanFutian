import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@/components/Button'
import FormField from '@/components/FormField'
import { useContact, useLocale, useNavigation } from '@/i18n/hooks'
import { HONEYPOT_FIELD, submitContactForm } from '@/lib/api'
import { messageForCode } from '@/lib/errorCodes'
import { buildMailtoFallback, validateField, validateForm } from '@/lib/validation'

/**
 * ContactForm.
 *
 * Validation strategy
 * ----------------------------------------------------------------------------
 *  • Fields are validated on blur, not while typing. Validating on every
 *    keystroke tells someone their email is wrong before they have finished
 *    writing it, which is both annoying and unhelpful.
 *  • Once a field *has* been blurred and flagged, it re-validates as it is
 *    edited, so the error clears the moment it is fixed.
 *  • Submitting validates everything at once.
 *
 * Accessibility strategy
 * ----------------------------------------------------------------------------
 *  • A failed submit renders an error summary with `role="alert"`, listing each
 *    problem as a link to the field it belongs to, and moves focus to it. That
 *    is what makes a long form usable with a screen reader — otherwise the user
 *    is told "there is a problem" with no way to find it.
 *  • Focus is moved by an effect rather than a timer, so it happens exactly once
 *    after the DOM updates and never depends on a frame callback.
 *  • Success replaces the form with a `role="status"` panel that takes focus.
 *  • A polite live region narrates the submitting state, which a changed button
 *    label alone does not reliably announce.
 *
 * Failure handling
 * ----------------------------------------------------------------------------
 * If submission fails for any reason other than field validation, the values stay
 * in the form and a `mailto:` link is offered, pre-filled with everything typed.
 * An enquiry is never lost to a broken endpoint.
 */
export default function ContactForm() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { CONTACT_FORM_COPY, CONTACT_FORM_FIELDS } = useContact()
  const { CONTACT_DETAILS } = useNavigation()

  // Validation messages coming from the pure helpers are English source keys.
  // Server field errors are stable codes. Both are resolved in the active locale.
  const localizeMessage = useCallback(
    (message, field) => {
      if (!message) return message
      const usesMax = message === 'max-length' || /under \{\{count\}\}/.test(message)
      return messageForCode(message, t, {
        count: usesMax ? field?.maxLength : field?.minLength,
      })
    },
    [t],
  )

  const [values, setValues] = useState(() =>
    Object.fromEntries(CONTACT_FORM_FIELDS.map((field) => [field.name, ''])),
  )
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  /** 'idle' | 'submitting' | 'success' | 'error' */
  const [status, setStatus] = useState('idle')
  const [failure, setFailure] = useState(null)
  const [honeypot, setHoneypot] = useState('')

  const fieldRefs = useRef({})
  const summaryRef = useRef(null)
  const failureRef = useRef(null)
  const successRef = useRef(null)
  /** When the visitor first interacted with the form, for the server's timing guard. */
  const startedAtRef = useRef(null)

  const noteStart = () => {
    if (startedAtRef.current === null) startedAtRef.current = Date.now()
  }

  /* Focus is requested by setting an intent, then performed in an effect once the
     element that should receive it has actually been rendered. */
  const pendingFocus = useRef(null)
  const [focusTick, setFocusTick] = useState(0)

  const queueFocus = (target) => {
    pendingFocus.current = target
    setFocusTick((tick) => tick + 1)
  }

  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null

    const refs = { summary: summaryRef, failure: failureRef, success: successRef }
    refs[target]?.current?.focus()
  }, [focusTick])

  const fieldsByName = useMemo(
    () => Object.fromEntries(CONTACT_FORM_FIELDS.map((field) => [field.name, field])),
    [CONTACT_FORM_FIELDS],
  )

  const mailtoHref = useMemo(
    () => buildMailtoFallback(CONTACT_FORM_FIELDS, values, CONTACT_DETAILS.email),
    [CONTACT_DETAILS.email, CONTACT_FORM_FIELDS, values],
  )

  const errorEntries = Object.entries(errors)
  const showSummary = errorEntries.length > 0

  const handleChange = (name, value) => {
    noteStart()
    setValues((prev) => ({ ...prev, [name]: value }))

    // Only re-validate fields that are already flagged, and only once the reader
    // has been told about them.
    setErrors((prev) => {
      if (!prev[name]) return prev
      const message = localizeMessage(validateField(fieldsByName[name], value), fieldsByName[name])
      if (!message) {
        const next = { ...prev }
        delete next[name]
        return next
      }
      return { ...prev, [name]: message }
    })
  }

  const handleBlur = (name) => {
    noteStart()
    setTouched((prev) => ({ ...prev, [name]: true }))

    const message = localizeMessage(
      validateField(fieldsByName[name], values[name]),
      fieldsByName[name],
    )
    setErrors((prev) => {
      if (!message) {
        if (!prev[name]) return prev
        const next = { ...prev }
        delete next[name]
        return next
      }
      return { ...prev, [name]: message }
    })
  }

  const focusField = (name) => {
    fieldRefs.current[name]?.focus()
  }

  const reset = () => {
    setValues(Object.fromEntries(CONTACT_FORM_FIELDS.map((field) => [field.name, ''])))
    setErrors({})
    setTouched({})
    setFailure(null)
    setStatus('idle')
    setHoneypot('')
    startedAtRef.current = null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const { errors: rawErrors, valid } = validateForm(CONTACT_FORM_FIELDS, values)
    const nextErrors = Object.fromEntries(
      Object.entries(rawErrors).map(([name, message]) => [
        name,
        localizeMessage(message, fieldsByName[name]),
      ]),
    )

    setTouched(Object.fromEntries(CONTACT_FORM_FIELDS.map((field) => [field.name, true])))
    setErrors(nextErrors)

    if (!valid) {
      setStatus('idle')
      setFailure(null)
      queueFocus('summary')
      return
    }

    setStatus('submitting')
    setFailure(null)

    try {
      // The server owns the honeypot decision. Sending the field instead of
      // short-circuiting to success here means a browser-autofilled hidden
      // input can never produce a green tick for an unsent enquiry.
      await submitContactForm(values, {
        honeypot,
        startedAt: startedAtRef.current,
        locale,
      })
      setStatus('success')
      queueFocus('success')
    } catch (error) {
      setStatus('error')
      setFailure(error)

      if (error?.kind === 'validation' && error.fieldErrors) {
        setErrors((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(error.fieldErrors).map(([name, message]) => [
              name,
              localizeMessage(message, fieldsByName[name]),
            ]),
          ),
        }))
        queueFocus('summary')
      } else {
        queueFocus('failure')
      }
    }
  }

  /* ---- Success: the form is replaced rather than left sitting underneath ---- */
  if (status === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="border-t border-line pt-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <p className="u-eyebrow">{t('Sent', { ns: 'common' })}</p>
        <h3 className="mt-6 font-display text-display-3 font-medium uppercase">
          {CONTACT_FORM_COPY.successTitle}
        </h3>
        <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted-strong">
          {CONTACT_FORM_COPY.successBody}
        </p>
        <div className="mt-9">
          <Button type="button" variant="outline" onClick={reset}>
            {CONTACT_FORM_COPY.successAgain}
          </Button>
        </div>
      </div>
    )
  }

  const submitting = status === 'submitting'

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-busy={submitting}
      className="border-t border-line pt-10"
    >
      {/* Narrates the in-flight state; a changed button label is not announced. */}
      <p aria-live="polite" className="sr-only">
        {submitting ? `${CONTACT_FORM_COPY.submittingLabel}.` : ''}
      </p>

      {/* ---- Validation summary ------------------------------------------ */}
      {showSummary && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mb-10 border-l-2 border-ink pl-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <p className="u-eyebrow">{CONTACT_FORM_COPY.summaryTitle}</p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-strong">
            {CONTACT_FORM_COPY.summaryIntro}
          </p>
          <ul className="mt-4 space-y-2">
            {errorEntries.map(([name, message]) => (
              <li key={name}>
                <a
                  href={`#contact-${name}`}
                  onClick={(event) => {
                    event.preventDefault()
                    focusField(name)
                  }}
                  className="u-link text-[0.875rem] text-ink"
                >
                  {fieldsByName[name]?.label ?? name} — {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Submission failure ------------------------------------------ */}
      {status === 'error' && failure && (
        <div
          ref={failureRef}
          tabIndex={-1}
          role="alert"
          className="mb-10 border-l-2 border-ink pl-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <p className="u-eyebrow">{CONTACT_FORM_COPY.errorTitle}</p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-strong">
            {messageForCode(failure.message, t)} {CONTACT_FORM_COPY.errorBody}
          </p>
          <div className="mt-5">
            <Button href={mailtoHref} variant="outline">
              {CONTACT_FORM_COPY.fallbackLabel}
            </Button>
          </div>
        </div>
      )}

      {/* ---- Fields ------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
        {CONTACT_FORM_FIELDS.map((field) => {
          const isWide = field.type === 'textarea' || field.type === 'select'

          return (
            <div key={field.name} className={isWide ? 'sm:col-span-2' : ''}>
              <FormField
                field={field}
                value={values[field.name]}
                error={touched[field.name] ? errors[field.name] : undefined}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={submitting}
                ref={(element) => {
                  fieldRefs.current[field.name] = element
                }}
              />
            </div>
          )
        })}
      </div>

      {/* ---- Honeypot ----------------------------------------------------- */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor={`contact-${HONEYPOT_FIELD}`}>{CONTACT_FORM_COPY.honeypotLabel}</label>
        <input
          id={`contact-${HONEYPOT_FIELD}`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {/* ---- Actions ------------------------------------------------------ */}
      <div className="mt-12 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[46ch] text-[0.8125rem] leading-relaxed text-muted-strong">
          {CONTACT_FORM_COPY.dataNote}
        </p>

        <Button type="submit" variant="accent" size="lg" disabled={submitting} icon={!submitting}>
          {submitting ? CONTACT_FORM_COPY.submittingLabel : CONTACT_FORM_COPY.submitLabel}
        </Button>
      </div>
    </form>
  )
}
