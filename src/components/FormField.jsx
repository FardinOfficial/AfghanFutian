import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * FormField — one labelled, validated field.
 *
 * Accessibility is the whole point of this component existing separately:
 *
 *  • Every control has a real `<label for>`, never a placeholder standing in for
 *    one. Placeholders disappear as soon as typing starts, which makes them a
 *    poor label and a worse one for anyone using a screen reader.
 *  • Helper text and the error message are wired up with `aria-describedby`, in
 *    that order, so the hint is read before the error.
 *  • `aria-invalid` is set on the control itself when it fails.
 *  • Required and optional fields are stated in text, not implied by an asterisk.
 *
 * Errors are never signalled by colour alone — there is always a message, an
 * `aria-invalid` state, and a hairline that darkens. The palette has no red, and
 * inventing one would break the design language for no accessibility gain.
 */

const CONTROL_BASE =
  'w-full border bg-transparent px-4 py-3.5 font-sans text-[0.9375rem] leading-snug ' +
  'transition-colors duration-300 placeholder:text-muted-strong'

const FormField = forwardRef(function FormField(
  { field, value, error, onChange, onBlur, disabled = false, idPrefix = 'contact' },
  ref,
) {
  const id = `${idPrefix}-${field.name}`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy =
    [field.hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  const border = error ? 'border-ink' : 'border-line'

  const shared = {
    id,
    name: field.name,
    value: value ?? '',
    disabled,
    required: field.required,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    onChange: (event) => onChange(field.name, event.target.value),
    onBlur: () => onBlur(field.name),
    className: `${CONTROL_BASE} ${border}`,
  }

  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="u-eyebrow flex items-baseline justify-between gap-4 text-ink"
      >
        <span>{field.label}</span>
        <span className="text-muted-strong">{field.required ? 'Required' : 'Optional'}</span>
      </label>

      <div className="relative mt-3">
        {field.type === 'textarea' && (
          <textarea
            {...shared}
            ref={ref}
            rows={field.rows ?? 6}
            maxLength={field.maxLength}
            autoComplete={field.autoComplete}
            className={`${shared.className} min-h-[10rem] resize-y`}
          />
        )}

        {field.type === 'select' && (
          <>
            <select
              {...shared}
              ref={ref}
              autoComplete={field.autoComplete}
              className={`${shared.className} appearance-none pr-12 ${
                value ? 'text-ink' : 'text-muted-strong'
              }`}
            >
              <option value="" disabled>
                {field.placeholder ?? 'Please choose'}
              </option>
              {(field.options ?? []).map((option) => (
                <option key={option} value={option} className="text-ink">
                  {option}
                </option>
              ))}
            </select>

            <ChevronDown
              aria-hidden="true"
              strokeWidth={1.5}
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-strong"
            />
          </>
        )}

        {field.type !== 'textarea' && field.type !== 'select' && (
          <input
            {...shared}
            ref={ref}
            type={field.type}
            autoComplete={field.autoComplete}
            inputMode={field.inputMode}
            maxLength={field.maxLength}
          />
        )}
      </div>

      {field.hint && (
        <p id={hintId} className="mt-2.5 text-[0.8125rem] leading-snug text-muted-strong">
          {field.hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="mt-2.5 flex items-start gap-2.5 text-[0.8125rem] leading-snug text-ink"
        >
          <span aria-hidden="true" className="mt-[0.4rem] h-[5px] w-[5px] shrink-0 bg-accent" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
})

export default FormField
