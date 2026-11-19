import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  Clock3,
  ExternalLink,
  Globe2,
  RotateCw,
  ShieldCheck,
  Video,
} from 'lucide-react'

import DateTimeStep from '@/components/scheduler/DateTimeStep'
import DetailsStep from '@/components/scheduler/DetailsStep'
import Logo from '@/components/Logo'
import { COMPANY } from '@/data/company.js'
import { ROUTES } from '@/data/navigation'
import { readHourFormat, saveHourFormat } from '@/lib/hourFormat'
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

const EMPTY_VALUES = {
  name: '',
  email: '',
  company: '',
  phone: '',
  notes: '',
  website: '',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'Please enter your full name.'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.'
  return errors
}

export function MeetingInfo({ selected, timeZone, hourFormat }) {
  return (
    <aside className="scheduler-panel scheduler-info" aria-label="Meeting information">
      <Logo onDark showMark size="sm" />

      <div>
        <p className="u-eyebrow">Meeting with Afghan Futian</p>
        <h2 className="mt-2.5">Let’s arrange the next move for your business.</h2>
        <p className="scheduler-info-copy">
          A focused 30-minute call to discuss sourcing, logistics or a specific requirement.
          Times come from our live calendar in your own timezone.
        </p>
      </div>

      <dl className="scheduler-facts">
        <div className="scheduler-fact">
          <Clock3 aria-hidden="true" />
          <dt>Duration</dt>
          <dd>{SCHEDULE_EVENT.durationMinutes} minutes</dd>
        </div>
        <div className="scheduler-fact">
          <Video aria-hidden="true" />
          <dt>Location</dt>
          <dd>Google Meet link after confirmation</dd>
        </div>
        <div className="scheduler-fact">
          <Globe2 aria-hidden="true" />
          <dt>Timezone</dt>
          <dd>{timeZone.replaceAll('_', ' ')}</dd>
        </div>
        {selected && (
          <div className="scheduler-fact">
            <CalendarCheck2 aria-hidden="true" />
            <dt>Selected</dt>
            <dd>
              {formatDate(selected.start, timeZone)}
              <br />
              {formatSlotRange(selected.start, selected.end, timeZone, {
                hour12: hourFormat === '12',
              })}{' '}
              {zoneLabel(selected.start, timeZone)}
            </dd>
          </div>
        )}
      </dl>

      <div className="scheduler-info-foot">
        Signed management links let you reschedule or cancel without an account. Need help?{' '}
        <a href={COMPANY.emailHref}>{COMPANY.email}</a>
      </div>
    </aside>
  )
}

/** Confirmation panel shown only after the provider has returned a booking UID. */
export function Summary({ booking, timeZone, token, emailsSent, isReschedule = false, hourFormat = '12' }) {
  const calendar = addToCalendarUrl({
    start: booking.start,
    end: booking.end,
    title: booking.title || SCHEDULE_EVENT.title,
    description: `Reference: ${booking.reference}`,
    location: booking.meetingUrl || SCHEDULE_EVENT.location,
    meetingUrl: booking.meetingUrl,
  })
  const manage = token ? manageUrl(token) : null

  return (
    <section className="scheduler-success" aria-labelledby="schedule-success-heading">
      <div className="scheduler-success-head">
        <span className="scheduler-check">
          <Check aria-hidden="true" strokeWidth={2.4} />
        </span>
        <div>
          <p className="u-eyebrow">Meeting confirmed</p>
          <h2 id="schedule-success-heading">
            {isReschedule ? 'Your new time is confirmed.' : 'Your meeting is booked.'}
          </h2>
          <p className="scheduler-success-intro">
            {emailsSent === false ? (
              <>
                The reservation is confirmed on our calendar. We could not send the confirmation
                email — please write to <a href={COMPANY.emailHref}>{COMPANY.email}</a> and we will
                send the details. The information below is your confirmation.
              </>
            ) : emailsSent === null ? (
              <>
                Your confirmation and joining details are being sent by our scheduling provider.
                Save the management link below if you may need to change this meeting.
              </>
            ) : (
              <>
                A confirmation with the Google Meet link and calendar invitation is on its way.
                Save the management link below in case you need to change the meeting.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="scheduler-success-grid">
        {[
          ['Date', formatDate(booking.start, timeZone)],
          ['Time', `${formatSlotRange(booking.start, booking.end, timeZone, { hour12: hourFormat === '12' })} ${zoneLabel(booking.start, timeZone)}`],
          ['Duration', `${SCHEDULE_EVENT.durationMinutes} minutes`],
          ['Timezone', timeZone.replaceAll('_', ' ')],
          ['Participant', booking.name || 'You'],
          ['Email', booking.email || '—'],
          ['Reference', booking.reference],
          ['Location', booking.meetingUrl ? 'Google Meet' : SCHEDULE_EVENT.location],
        ].map(([label, value]) => (
          <div key={label} className="scheduler-success-cell">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="scheduler-success-actions">
        {booking.meetingUrl && (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="scheduler-btn primary"
          >
            <Video aria-hidden="true" className="h-4 w-4" />
            Open Google Meet
          </a>
        )}
        <a href={calendar} target="_blank" rel="noreferrer noopener" className="scheduler-btn">
          <CalendarCheck2 aria-hidden="true" className="h-4 w-4" />
          Add to calendar
        </a>
        {manage && (
          <>
            <a href={manage} className="scheduler-btn">
              Reschedule
            </a>
            <a href={manage} className="scheduler-btn">
              Cancel
            </a>
          </>
        )}
        <Link to={ROUTES.home} className="scheduler-btn">
          Return to homepage
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

/**
 * NativeScheduler — the entire booking flow, backed by real server functions.
 *
 * In `book` mode it collects the minimum details and creates a real Cal.com
 * reservation. In `reschedule` mode it reuses the existing attendee details and
 * only asks for a new slot. A success screen is only shown after Cal.com has
 * confirmed the booking and returned a UID.
 */
export function NativeScheduler({ mode = 'book', token, booking: initialBooking, onManageToken }) {
  const isReschedule = mode === 'reschedule'
  const initialUid = initialBooking?.uid || ''
  const [step, setStep] = useState('date')
  const [timeZone, setTimeZone] = useState(
    () => initialBooking?.timeZone || resolvedTimeZone(),
  )
  const [hourFormat, setHourFormat] = useState(readHourFormat)
  const zones = useMemo(() => timezoneOptions(), [])
  const [month, setMonth] = useState(() => {
    // Start on the visitor's calendar month, not UTC's. Near a month boundary
    // those differ for a large part of the world.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(new Date())
    return {
      year: Number(parts.find((part) => part.type === 'year')?.value),
      monthIndex: Number(parts.find((part) => part.type === 'month')?.value) - 1,
    }
  })
  // `null` means "not loaded yet"; `{}` means the calendar answered with no
  // slots. Keeping the states separate avoids a second loading flag.
  const [slots, setSlots] = useState(null)
  const [bookingWindow, setBookingWindow] = useState(null)
  const [error, setError] = useState(null)
  const loading = slots === null && !error
  const [attempt, setAttempt] = useState(0)
  const [activeDate, setActiveDate] = useState(null)
  const [selected, setSelected] = useState(null)
  const [values, setValues] = useState(() => ({
    ...EMPTY_VALUES,
    name: initialBooking?.name || '',
    email: initialBooking?.email || '',
    company: initialBooking?.company || '',
    phone: initialBooking?.phone || '',
    notes: initialBooking?.notes || initialBooking?.purpose || '',
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
      setActiveDate(null)
      setSelected(null)
      setError(null)
    } catch (caught) {
      setSlots(null)
      setError(
        caught instanceof ScheduleApiError &&
          ['unavailable', 'server', 'network', 'timeout'].includes(caught.kind)
          ? 'Please try again in a moment.'
          : caught.message,
      )
    }
  }, [timeZone, isReschedule, initialUid])

  useEffect(() => {
    // Starting in a microtask keeps the effect free of synchronous updates.
    void Promise.resolve().then(loadSlots)
  }, [loadSlots, attempt])

  const changeTimeZone = (zone) => {
    setTimeZone(zone)
    setSelected(null)
    setActiveDate(null)
    setError(null)
    setSlots(null)
  }

  const changeHourFormat = (format) => {
    setHourFormat(format)
    saveHourFormat(format)
  }

  const changeMonth = (next) => {
    setMonth(next)
    setActiveDate(null)
    setSelected(null)
  }

  const changeValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  const handleBlur = (field) => {
    const found = validate({ ...values, [field]: values[field] })
    setErrors((current) => ({ ...current, [field]: found[field] }))
  }

  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message),
  )

  const confirm = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      let data
      if (isReschedule) {
        data = await rescheduleBooking({
          token,
          uid: initialUid,
          start: selected.start,
          timeZone,
        })
        const nextToken = data.manageToken || token
        onManageToken?.(nextToken)
        setResult({ booking: data.booking, token: nextToken, emailsSent: data.emailsSent })
      } else {
        const found = validate(values)
        setErrors(found)
        if (Object.keys(found).length > 0) return
        data = await createBooking({
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          phone: values.phone.trim(),
          purpose: values.notes.trim(),
          timeZone,
          start: selected.start,
          website: values.website,
        })
        // The server silently accepts a filled honeypot with no booking. Show a
        // neutral acknowledgement instead of trying to render a confirmation.
        if (!data.booking) {
          setResult({ booking: null, token: null, emailsSent: data.emailsSent ?? false })
          setStep('success')
          return
        }
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
        setActiveDate(null)
        setSlots(null)
        setError(null)
        setAttempt((value) => value + 1)
        setStep('date')
      } else if (caught.fieldErrors && !isReschedule) {
        setStep('details')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = (event) => {
    event.preventDefault()
    if (step === 'details') void confirm()
  }

  if (step === 'success' && result) {
    if (!result.booking) {
      return (
        <div className="scheduler-card">
          <section className="scheduler-success solo" role="status" aria-labelledby="schedule-quiet-heading">
            <div className="scheduler-success-head">
              <span className="scheduler-check">
                <Check aria-hidden="true" strokeWidth={2.4} />
              </span>
              <div>
                <p className="u-eyebrow">Request received</p>
                <h2 id="schedule-quiet-heading">Thank you for getting in touch.</h2>
                <p className="scheduler-success-intro">
                  If you meant to book a meeting, please return to the calendar and choose a time.
                  You can also write to <a href={COMPANY.emailHref}>{COMPANY.email}</a> and we will
                  arrange it directly.
                </p>
              </div>
            </div>
            <div className="scheduler-success-actions">
              <button type="button" onClick={() => setStep('date')} className="scheduler-btn accent">
                Choose a time
              </button>
              <Link to={ROUTES.home} className="scheduler-btn">Return to homepage</Link>
            </div>
          </section>
        </div>
      )
    }

    return (
      <div className="scheduler-card">
        <MeetingInfo selected={selected} timeZone={timeZone} hourFormat={hourFormat} />
        <Summary
          booking={result.booking}
          timeZone={timeZone}
          token={result.token}
          emailsSent={result.emailsSent}
          isReschedule={isReschedule}
          hourFormat={hourFormat}
        />
      </div>
    )
  }

  return (
    <form className="scheduler-card" onSubmit={onSubmit} noValidate>
      <MeetingInfo selected={selected} timeZone={timeZone} hourFormat={hourFormat} />

      {step === 'date' && (
        <DateTimeStep
          timeZone={timeZone}
          zones={zones}
          onTimeZoneChange={changeTimeZone}
          hourFormat={hourFormat}
          onHourFormatChange={changeHourFormat}
          slots={slots}
          activeDate={activeDate}
          selected={selected}
          onDateSelect={(key) => {
            setActiveDate(key)
            setSelected(null)
            setSubmitError(null)
          }}
          onSlotSelect={(slot) => {
            setSelected(slot)
            setSubmitError(null)
          }}
          loading={loading}
          error={error}
          onRetry={() => {
            setError(null)
            setSlots(null)
            setAttempt((value) => value + 1)
          }}
          month={month}
          onMonthChange={changeMonth}
          window={bookingWindow}
        />
      )}

      {step === 'details' && (
        <DetailsStep
          values={values}
          errors={visibleErrors}
          selected={selected}
          timeZone={timeZone}
          hourFormat={hourFormat}
          onChange={changeValue}
          onBlur={handleBlur}
        />
      )}

      {submitError && (
        <p role="alert" className="scheduler-alert ms-1 me-1">
          {submitError}
        </p>
      )}

      <div className="scheduler-actions">
        {step === 'date' && selected && !isReschedule && (
          <button
            type="button"
            onClick={() => {
              setErrors({})
              setStep('details')
            }}
            className="scheduler-btn accent"
          >
            Continue
            <ArrowRight aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
          </button>
        )}

        {step === 'date' && selected && isReschedule && (
          <button type="button" onClick={() => void confirm()} disabled={submitting} className="scheduler-btn accent">
            {submitting ? (
              <>
                <RotateCw aria-hidden="true" className="h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              <>
                <Check aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                Confirm new time
              </>
            )}
          </button>
        )}

        {step === 'date' && !selected && (
          <span className="scheduler-muted">Select a time to continue.</span>
        )}

        {step === 'details' && (
          <>
            <button type="submit" disabled={submitting} className="scheduler-btn accent">
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
              onClick={() => setStep('date')}
              disabled={submitting}
              className="scheduler-text-btn inline-flex items-center gap-2"
            >
              <ArrowLeft aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
              Change time
            </button>
            <span className="scheduler-muted ms-auto inline-flex items-center gap-1.5">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
              No account needed
            </span>
          </>
        )}
      </div>
    </form>
  )
}

export default NativeScheduler
