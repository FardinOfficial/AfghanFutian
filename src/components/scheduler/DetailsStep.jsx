import FormField from '@/components/FormField'
import { COMPANY } from '@/data/company.js'
import {
  formatDate,
  formatSlotRange,
  SCHEDULE_EVENT,
  zoneLabel,
} from '@/lib/scheduling'

const FIELDS = [
  {
    name: 'name',
    label: 'Full name',
    type: 'text',
    required: true,
    autoComplete: 'name',
    maxLength: 100,
    hint: 'The name we should use in your confirmation.',
  },
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    required: true,
    autoComplete: 'email',
    maxLength: 254,
    hint: 'Your confirmation and joining link go here.',
  },
  {
    name: 'company',
    label: 'Company',
    type: 'text',
    required: false,
    autoComplete: 'organization',
    maxLength: 120,
  },
  {
    name: 'phone',
    label: 'Phone number',
    type: 'tel',
    required: false,
    autoComplete: 'tel',
    maxLength: 40,
    hint: 'Include your country code.',
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    rows: 4,
    maxLength: 1000,
    hint: 'Anything you would like us to prepare. Up to 1000 characters.',
  },
]

/** Contact details for the chosen slot. The honeypot is visually hidden. */
export default function DetailsStep({
  values,
  errors,
  selected,
  timeZone,
  hourFormat,
  onChange,
  onBlur,
}) {
  const timeOptions = { hour12: hourFormat === '12' }

  return (
    <>
      <section className="scheduler-panel" aria-labelledby="schedule-details-heading">
        <h2 id="schedule-details-heading" className="scheduler-panel-title">
          Your details
        </h2>
        <p className="scheduler-muted mt-1.5">
          Only your name and email are required. Everything else is optional.
        </p>

        <div className="scheduler-form mt-5">
          {FIELDS.map((field) => (
            <div key={field.name}>
              <FormField
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={onChange}
                onBlur={onBlur}
                idPrefix="schedule"
              />
            </div>
          ))}
        </div>

        {/* Honeypot: real visitors never see or fill this field. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
          <label htmlFor="schedule-website">Leave this field empty</label>
          <input
            id="schedule-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website ?? ''}
            onChange={(event) => onChange('website', event.target.value)}
          />
        </div>
      </section>

      <section className="scheduler-panel scheduler-summary" aria-labelledby="schedule-summary-heading">
        <h2 id="schedule-summary-heading" className="scheduler-panel-title">
          Booking summary
        </h2>

        <div className="scheduler-summary-date">
          <span className="u-eyebrow">Your time</span>
          <strong>{formatDate(selected.start, timeZone)}</strong>
          <p>
            {formatSlotRange(selected.start, selected.end, timeZone, timeOptions)}{' '}
            {zoneLabel(selected.start, timeZone)}
          </p>
        </div>

        <dl>
          {[
            ['Duration', `${SCHEDULE_EVENT.durationMinutes} minutes`],
            ['Location', SCHEDULE_EVENT.location],
            ['Host', COMPANY.legalName],
          ].map(([label, value]) => (
            <div key={label} className="scheduler-summary-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="scheduler-notice mt-5">
          <strong>Secure confirmation</strong>
          <span>
            Confirming creates a real reservation. Your confirmation includes a signed link for
            rescheduling or cancelling — no account needed.
          </span>
        </div>

        <p className="scheduler-muted mt-4 leading-relaxed">
          Prefer to write first? Email <a href={COMPANY.emailHref}>{COMPANY.email}</a>.
        </p>
      </section>
    </>
  )
}
