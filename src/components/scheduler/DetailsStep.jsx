import FormField from '@/components/FormField'
import { COMPANY } from '@/data/company.js'
import { formatDate, formatTime, zoneLabel } from '@/lib/scheduling'

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
    hint: 'Your confirmation, calendar invitation and joining link go here.',
  },
  {
    name: 'company',
    label: 'Company or organisation',
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
    hint: 'Include your country code, for example +93 70 000 0000.',
  },
  {
    name: 'purpose',
    label: 'Purpose of the meeting',
    type: 'textarea',
    required: true,
    rows: 5,
    maxLength: 1000,
    hint: 'A short outline helps us come prepared. Up to 1000 characters.',
  },
]

/** Contact details for a chosen slot. The honeypot is visually hidden. */
export default function DetailsStep({ values, errors, selected, timeZone, onChange, onBlur }) {
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="u-eyebrow">Your selection</p>
        <div className="mt-6 border-t border-line">
          <div className="border-b border-line py-5">
            <p className="text-[1.0625rem] leading-snug text-ink">
              {formatDate(selected.start, timeZone)}
            </p>
            <p className="mt-2 text-[0.9375rem] tabular-nums text-muted-strong">
              {formatTime(selected.start, timeZone)} – {formatTime(selected.end, timeZone)}{' '}
              {zoneLabel(selected.start, timeZone)}
            </p>
          </div>
          <div className="border-b border-line py-5 text-[0.875rem] leading-relaxed text-muted-strong">
            <p>30 minutes · Google Meet</p>
            <p className="mt-1">Hosted by {COMPANY.legalName}</p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <p className="u-eyebrow">Your details</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <FormField
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={onChange}
                onBlur={onBlur}
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
      </div>
    </div>
  )
}
