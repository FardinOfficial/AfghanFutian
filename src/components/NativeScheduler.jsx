import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  ExternalLink,
  Mail,
  RotateCw,
  Video,
} from 'lucide-react'

import Button from '@/components/Button'
import DateTimeStep from '@/components/scheduler/DateTimeStep'
import DetailsStep from '@/components/scheduler/DetailsStep'
import { COMPANY } from '@/data/company.js'
import {
  ScheduleApiError,
  SCHEDULE_ERROR_COPY,
  createBooking,
  fetchAvailability,
  rescheduleBooking,
} from '@/lib/scheduleApi'
import {
  addToCalendarUrl,
  formatDate,
  formatSlotRange,
  manageUrl,
  resolvedTimeZone,
  SCHEDULE_EVENT,
  timezoneOptions,
  zoneLabel,
} from '@/lib/scheduling'

const EMPTY_VALUES = { name: '', email: '', company: '', phone: '', purpose: '', website: '' }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'Please enter your full name.'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.'
  if (values.purpose.trim().length < 10) errors.purpose = 'Please tell us a little more — at least 10 characters.'
  return errors
}

function StepBar({ step }) {
  const steps = [
    { id: 'date', label: 'Date & time' },
    { id: 'details', label: 'Your details' },
    { id: 'review', label: 'Review' },
  ]
  const current = steps.findIndex((item) => item.id === step)
  return (
    <ol className="flex flex-wrap gap-x-8 gap-y-3 border-b border-line pb-5" aria-label="Booking progress">
      {steps.map((item, index) => (
        <li key={item.id} className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center border text-[0.625rem] font-medium tabular-nums ${
              index < current
                ? 'border-ink bg-ink text-canvas'
                : index === current
                  ? 'border-ink text-ink'
                  : 'border-line text-muted-strong'
            }`}
          >
            {index < current ? <Check strokeWidth={2.4} className="h-3 w-3" /> : index + 1}
          </span>
          <span
            className={`text-[0.6875rem] font-medium uppercase tracking-[0.14em] ${
              index === current ? 'text-ink' : 'text-muted-strong'
            }`}
            aria-current={index === current ? 'step' : undefined}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function Summary({ booking, timeZone, token }) {
  const calendar = addToCalendarUrl({
    start: booking.start,
    end: booking.end,
    title: booking.title || SCHEDULE_EVENT.title,
    description: `Reference: ${booking.reference}`,
    location: booking.meetingUrl || SCHEDULE_EVENT.location,
    meetingUrl: booking.meetingUrl,
  })

  return (
    <div className="border border-line bg-surface">
      <div className="border-b border-line px-6 py-7 sm:px-8">
        <p className="u-eyebrow">Meeting confirmed</p>
        <h3 className="mt-4 font-display text-[1.5rem] font-medium leading-tight sm:text-[1.75rem]">
          {formatDate(booking.start, timeZone)}
        </h3>
        <p className="mt-2 text-[1rem] tabular-nums text-muted-strong">
          {formatSlotRange(booking.start, booking.end, timeZone)} {zoneLabel(booking.start, timeZone)}
        </p>
      </div>

      <dl className="grid gap-px bg-line sm:grid-cols-2">
        {[
          ['Reference', booking.reference],
          ['Duration', `${SCHEDULE_EVENT.durationMinutes} minutes`],
          ['Location', booking.meetingUrl ? 'Google Meet' : SCHEDULE_EVENT.location],
          ['Host', COMPANY.legalName],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface px-6 py-5 sm:px-8">
            <dt className="u-eyebrow text-muted-strong">{label}</dt>
            <dd className="mt-2 text-[0.9375rem] text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3 px-6 py-7 sm:px-8">
        {booking.meetingUrl && (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 bg-ink px-5 py-3.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-ink/85"
          >
            <Video aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
            Open Google Meet
          </a>
        )}
        <a
          href={calendar}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 border border-ink px-5 py-3.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-canvas"
        >
          <CalendarCheck2 aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
          Add to calendar
        </a>
        {token && (
          <a
            href={manageUrl(token)}
            className="u-link inline-flex items-center gap-2 px-2 py-3.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink"
          >
            Reschedule or cancel
            <ExternalLink aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * NativeScheduler — the entire booking flow, backed by real server functions.
 *
 * In `book` mode it collects details and creates a real Cal.com reservation.
 * In `reschedule` mode it reuses the existing attendee details and only asks
 * for a new slot. There is no optimistic UI: a success screen is only shown
 * after Cal.com has confirmed the booking and returned a UID.
 */
export default function NativeScheduler({ mode = 'book', token, booking: initialBooking, onManageToken }) {
  const isReschedule = mode === 'reschedule'
  const initialUid = initialBooking?.uid || ''
  const [step, setStep] = useState('date')
  const [timeZone, setTimeZone] = useState(
    () => initialBooking?.timeZone || resolvedTimeZone(),
  )
  const zones = useMemo(() => timezoneOptions(), [])
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return { year: now.getUTCFullYear(), monthIndex: now.getUTCMonth() }
  })
  // `null` means "not loaded yet"; `{}` means the calendar answered and there
  // are no slots. Keeping that distinction avoids a second loading flag and a
  // synchronous state update at the start of the fetch effect.
  const [slots, setSlots] = useState(null)
  const [bookingWindow, setBookingWindow] = useState(null)
  const [error, setError] = useState(null)
  const loading = slots === null && !error
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState(null)
  const [values, setValues] = useState(() => ({
    ...EMPTY_VALUES,
    name: initialBooking?.name || '',
    email: initialBooking?.email || '',
    company: initialBooking?.company || '',
    phone: initialBooking?.phone || '',
    purpose: initialBooking?.purpose || '',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [result, setResult] = useState(null)

  const loadSlots = useCallback(async () => {
    try {
      const today = new Date()
      const from = today.toISOString().slice(0, 10)
      const to = new Date(today.getTime() + 30 * 86_400_000).toISOString().slice(0, 10)
      const data = await fetchAvailability({
        from,
        to,
        timeZone,
        rescheduleUid: isReschedule ? initialUid : undefined,
      })
      setSlots(data.slots ?? {})
      setBookingWindow(data.window ?? null)
      setSelected(null)
      setError(null)
    } catch (caught) {
      setSlots(null)
      setError(
        caught instanceof ScheduleApiError
          ? caught.kind === 'unavailable' || caught.kind === 'server' || caught.kind === 'network' || caught.kind === 'timeout'
            ? 'We could not load live availability just now. Please try again.'
            : caught.message
          : 'We could not load live availability just now. Please try again.',
      )
    }
  }, [timeZone, isReschedule, initialUid])

  useEffect(() => {
    // The fetch is asynchronous; starting it in a microtask keeps the effect
    // itself free of synchronous state updates.
    void Promise.resolve().then(loadSlots)
  }, [loadSlots, attempt])

  const changeTimeZone = (zone) => {
    setTimeZone(zone)
    setSelected(null)
    setError(null)
    setSlots(null)
  }

  const changeValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const toReview = () => {
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      setSubmitError(null)
      setStep('review')
    }
  }

  const confirm = async () => {
    if (!selected) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (isReschedule) {
        const data = await rescheduleBooking({
          token,
          uid: initialUid,
          start: selected.start,
          timeZone,
        })
        const nextToken = data.manageToken || token
        onManageToken?.(nextToken)
        setResult({ booking: data.booking, token: nextToken, emailsSent: data.emailsSent })
      } else {
        const data = await createBooking({
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          phone: values.phone.trim(),
          purpose: values.purpose.trim(),
          timeZone,
          start: selected.start,
          website: values.website,
        })
        onManageToken?.(data.manageToken)
        setResult({ booking: data.booking, token: data.manageToken, emailsSent: data.emailsSent })
      }
      setStep('success')
    } catch (caught) {
      const kind = caught instanceof ScheduleApiError ? caught.kind : 'server'
      setSubmitError(SCHEDULE_ERROR_COPY[kind] ?? SCHEDULE_ERROR_COPY.server)
      if (caught.fieldErrors) setErrors(caught.fieldErrors)
      if (kind === 'slot_taken' || kind === 'slot_expired') {
        setSelected(null)
        setStep('date')
        setSlots(null)
        setError(null)
        setAttempt((value) => value + 1)
      } else if (caught.fieldErrors && !isReschedule) {
        setStep('details')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'success' && result) {
    return (
      <div>
        <div className="mb-10 flex items-start gap-4 border border-line bg-surface px-6 py-5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-accent text-ink">
            <Check strokeWidth={2.4} className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-[1.125rem] font-medium">
              {isReschedule ? 'Your meeting has been rescheduled.' : 'Your meeting is booked.'}
            </h3>
            <p className="mt-2 max-w-[60ch] text-[0.875rem] leading-relaxed text-muted-strong">
              It is confirmed on our calendar.{' '}
              {result.emailsSent === false ? (
                <>
                  We could not send the confirmation email — please write to{' '}
                  <a href={COMPANY.emailHref} className="u-link text-ink">
                    {COMPANY.email}
                  </a>{' '}
                  so we can send the details. The information below is your confirmation.
                </>
              ) : result.emailsSent === null ? (
                <>
                  Your confirmation and joining details are being sent by our scheduling provider.
                  Save the reschedule or cancel link below if you may need to change this meeting.
                </>
              ) : (
                <>
                  A confirmation with the Google Meet link and a calendar invitation is on its way to{' '}
                  {isReschedule ? initialBooking?.email || 'your inbox' : values.email.trim()}.
                </>
              )}
            </p>
          </div>
        </div>

        <Summary booking={result.booking} timeZone={timeZone} token={result.token} />

        <p className="mt-8 flex items-start gap-3 text-[0.8125rem] leading-relaxed text-muted-strong">
          <Mail aria-hidden="true" strokeWidth={1.6} className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Need to change something? Save the secure link above — it lets you reschedule or cancel
            without signing in and appears in our branded emails when they are enabled.
          </span>
        </p>
      </div>
    )
  }

  return (
    <div>
      <StepBar step={step} />

      <div className="pt-10">
        {step === 'date' && (
          <DateTimeStep
            timeZone={timeZone}
            zones={zones}
            onTimeZoneChange={changeTimeZone}
            slots={slots}
            selected={selected}
            onSelect={setSelected}
            loading={loading}
            error={error}
            onRetry={() => {
              setError(null)
              setSlots(null)
              setAttempt((value) => value + 1)
            }}
            month={month}
            onMonthChange={setMonth}
            window={bookingWindow}
          />
        )}

        {step === 'details' && (
          <DetailsStep
            values={values}
            errors={errors}
            selected={selected}
            timeZone={timeZone}
            onChange={changeValue}
            onBlur={() => {}}
          />
        )}

        {step === 'review' && selected && (
          <div className="max-w-[52rem]">
            <p className="u-eyebrow">Review</p>
            <h3 className="mt-4 font-display text-[1.5rem] font-medium">Confirm your meeting.</h3>
            <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted-strong">
              Please check the details below. Confirming creates a real reservation on our calendar
              and sends a confirmation to your email address.
            </p>

            <dl className="mt-9 grid gap-px border border-line bg-line sm:grid-cols-2">
              {[
                ['When', `${formatDate(selected.start, timeZone)} · ${formatSlotRange(selected.start, selected.end, timeZone)} ${zoneLabel(selected.start, timeZone)}`],
                ['Duration', `${SCHEDULE_EVENT.durationMinutes} minutes`],
                ['Location', SCHEDULE_EVENT.location],
                ['Name', values.name.trim()],
                ['Email', values.email.trim()],
                ['Company', values.company.trim() || '—'],
              ].map(([label, value]) => (
                <div key={label} className="bg-canvas px-6 py-5">
                  <dt className="u-eyebrow text-muted-strong">{label}</dt>
                  <dd className="mt-2 text-[0.9375rem] leading-snug text-ink">{value}</dd>
                </div>
              ))}
              {values.purpose.trim() && (
                <div className="bg-canvas px-6 py-5 sm:col-span-2">
                  <dt className="u-eyebrow text-muted-strong">Purpose</dt>
                  <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{values.purpose.trim()}</dd>
                </div>
              )}
            </dl>

            {submitError && (
              <p role="alert" className="mt-6 border-l-2 border-ink pl-4 text-[0.875rem] leading-relaxed text-ink">
                {submitError}
              </p>
            )}
          </div>
        )}
      </div>

      {submitError && step !== 'review' && (
        <p role="alert" className="mt-8 border-l-2 border-ink pl-4 text-[0.875rem] leading-relaxed text-ink">
          {submitError}
        </p>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
        {step === 'date' && selected && (
          <Button
            // Details do not exist yet on this step. Validation belongs to the
            // review action, after the visitor has actually filled them in.
            onClick={() => setStep(isReschedule ? 'review' : 'details')}
            variant="accent"
            size="lg"
            icon={false}
          >
            {isReschedule ? 'Review new time' : 'Continue'}
            <ArrowRight aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
          </Button>
        )}

        {step === 'details' && (
          <>
            <Button onClick={toReview} variant="accent" size="lg" icon={false}>
              Review booking
              <ArrowRight aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => setStep('date')}
              className="inline-flex items-center gap-2 px-3 py-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-strong transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
              Change time
            </button>
          </>
        )}

        {step === 'review' && (
          <>
            <button
              type="button"
              onClick={confirm}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-ink px-6 py-4 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-ink/85 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RotateCw aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Reserving your time…
                </>
              ) : (
                <>
                  <Check aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                  Confirm booking
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep(isReschedule ? 'date' : 'details')}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-3 py-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-strong transition-colors hover:text-ink disabled:opacity-50"
            >
              <ArrowLeft aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
              Go back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
