import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CalendarCheck2,
  CalendarX2,
  Check,
  Clock3,
  RotateCw,
  ShieldCheck,
  Video,
} from 'lucide-react'

import MeetingInfo, { NativeScheduler } from '@/components/NativeScheduler'
import { COMPANY } from '@/data/company.js'
import { CONTACT_DETAILS, ROUTES } from '@/data/navigation'
import { readHourFormat } from '@/lib/hourFormat'
import {
  ScheduleApiError,
  cancelBooking,
  fetchManage,
  SCHEDULE_ERROR_COPY,
} from '@/lib/scheduleApi'
import {
  addToCalendarUrl,
  formatDate,
  formatSlotRange,
  manageUrl,
  SCHEDULE_EVENT,
  timeZoneLabel,
  zoneLabel,
} from '@/lib/scheduling'

function Header({ label, title, copy }) {
  return (
    <header className="scheduler-page-head">
      <div>
        <p className="scheduler-kicker">Manage · {label}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <div className="scheduler-head-meta">
        <span className="scheduler-chip">
          <ShieldCheck aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
          Signed link
        </span>
        <span className="scheduler-chip">
          <Clock3 aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
          No account needed
        </span>
      </div>
    </header>
  )
}

function ManageCard({ children }) {
  return <div className="scheduler-card">{children}</div>
}

function DetailGrid({ booking, timeZone, hourFormat = '12' }) {
  const cells = [
    ['Date', formatDate(booking.start, timeZone)],
    ['Time', `${formatSlotRange(booking.start, booking.end, timeZone, { hour12: hourFormat === '12' })} ${zoneLabel(booking.start, timeZone)}`],
    ['Duration', `${SCHEDULE_EVENT.durationMinutes} minutes`],
    ['Timezone', `${timeZoneLabel(timeZone)} (${zoneLabel(booking.start, timeZone)})`],
    ['Reference', booking.reference],
    ['Attendee', booking.name || 'You'],
    ['Email', booking.email || '—'],
    ['Location', booking.meetingUrl ? 'Google Meet' : SCHEDULE_EVENT.location],
  ]
  return (
    <div className="scheduler-success-grid">
      {cells.map(([label, value]) => (
        <div key={label} className="scheduler-success-cell">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

/**
 * ManageBookingPage — the destination of the signed link in a confirmation
 * email. The URL token is the proof that the visitor is the attendee; the server
 * re-checks it, the booking UID and the email before allowing any change.
 */
export default function ManageBookingPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [state, setState] = useState(() => ({
    status: token ? 'loading' : 'error',
    booking: null,
    flags: null,
  }))
  const [error, setError] = useState(() => (token ? null : SCHEDULE_ERROR_COPY.invalid_link))
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  // Read the clock once so render stays pure and "past" never flickers.
  const [nowIso] = useState(() => new Date().toISOString())
  const [hourFormat] = useState(readHourFormat)
  const cancelTriggerRef = useRef(null)
  const dialogRef = useRef(null)
  const cancelledHeadingRef = useRef(null)
  const wasConfirmingRef = useRef(false)

  const closeDialog = useCallback(() => {
    setConfirming(false)
    setReason('')
  }, [])

  useEffect(() => {
    let active = true
    if (!token) return () => { active = false }

    fetchManage(token)
      .then((data) => {
        if (!active) return
        setState({
          status: 'ready',
          booking: data.booking,
          flags: { canCancel: data.canCancel, canReschedule: data.canReschedule },
        })
      })
      .catch((caught) => {
        if (!active) return
        const kind = caught instanceof ScheduleApiError ? caught.kind : 'server'
        setError(SCHEDULE_ERROR_COPY[kind] ?? SCHEDULE_ERROR_COPY.server)
        setState({ status: 'error', booking: null, flags: null })
      })

    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (!confirming) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) closeDialog()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [
        ...dialogRef.current.querySelectorAll('button:not(:disabled), textarea:not(:disabled)'),
      ]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable.at(-1)
      // A disabled confirm button can blur focus out of the dialog. Bring it
      // back instead of letting Tab wander into the page behind the modal.
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault()
        const target = event.shiftKey ? last : first
        target.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirming, busy, closeDialog])

  useEffect(() => {
    if (wasConfirmingRef.current && !confirming) {
      if (state.status === 'cancelled') cancelledHeadingRef.current?.focus()
      else cancelTriggerRef.current?.focus()
    }
    wasConfirmingRef.current = confirming
  }, [confirming, state.status])

  const cancel = async () => {
    if (!state.booking) return
    // Move focus off the button before it becomes disabled, so the modal keeps
    // focus even while the request is in flight.
    dialogRef.current?.querySelector('textarea')?.focus()
    setBusy(true)
    setActionError(null)
    try {
      await cancelBooking({
        token,
        uid: state.booking.uid,
        reason: reason.trim() || 'Cancelled by attendee via the website',
      })
      setState((current) => ({ ...current, status: 'cancelled' }))
      closeDialog()
    } catch (caught) {
      const kind = caught instanceof ScheduleApiError ? caught.kind : 'server'
      setActionError(SCHEDULE_ERROR_COPY[kind] ?? SCHEDULE_ERROR_COPY.server)
    } finally {
      setBusy(false)
    }
  }

  const shell = (content, header) => (
    <div className="scheduler-page" dir="ltr">
      <div className="scheduler-shell">
        {header}
        {content}
        <footer className="scheduler-page-foot">
          <span>Questions? Write to {CONTACT_DETAILS.email}.</span>
          <Link to={ROUTES.home}>Return to homepage</Link>
        </footer>
      </div>
    </div>
  )

  if (state.status === 'loading') {
    return shell(
      <ManageCard>
        <div className="scheduler-panel scheduler-info">
          <p className="u-eyebrow">Manage meeting</p>
          <h2 className="mt-3">Checking your link…</h2>
          <p className="scheduler-info-copy">Reading the booking from our live calendar.</p>
        </div>
        <div className="scheduler-success" role="status" aria-label="Loading booking">
          <div className="scheduler-skeleton h-24" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="scheduler-skeleton h-16" />
            ))}
          </div>
          <span className="sr-only">One moment…</span>
        </div>
      </ManageCard>,
      <Header label="link" title="Opening your meeting." copy="We are verifying the signed link in your email." />,
    )
  }

  if (state.status === 'error') {
    return shell(
      <ManageCard>
        <div className="scheduler-success solo">
          <div className="scheduler-notice">
            <strong>We could not open that booking.</strong>
            <span>{error || SCHEDULE_ERROR_COPY.invalid_link}</span>
          </div>
          <div className="scheduler-success-actions">
            <Link to={ROUTES.contact} className="scheduler-btn primary">Contact us</Link>
            <Link to={ROUTES.schedule} className="scheduler-btn">Book a new meeting</Link>
          </div>
        </div>
      </ManageCard>,
      <Header label="link" title="Link unavailable." copy="This management link is invalid or has expired." />,
    )
  }

  const booking = state.booking
  const timeZone = booking.timeZone || 'UTC'
  const info = <MeetingInfo selected={booking} timeZone={timeZone} hourFormat={hourFormat} />
  const bookingStatus = String(booking.status || '').toLowerCase()
  const providerCancelled = bookingStatus === 'cancelled' || bookingStatus === 'rejected'
  const isPast =
    Number.isFinite(Date.parse(booking.start)) && Date.parse(booking.start) <= Date.parse(nowIso)

  if (state.status === 'cancelled' || providerCancelled) {
    return shell(
      <ManageCard>
        {info}
        <section className="scheduler-success" aria-labelledby="manage-cancelled-heading">
          <div className="scheduler-success-head">
            <span className="scheduler-check"><CalendarX2 aria-hidden="true" strokeWidth={2.4} /></span>
            <div>
              <p className="u-eyebrow">Meeting cancelled</p>
              <h2 id="manage-cancelled-heading" ref={cancelledHeadingRef} tabIndex={-1}>
                {providerCancelled ? 'This meeting was cancelled.' : 'The meeting has been cancelled.'}
              </h2>
              <p className="scheduler-success-intro">
                It is no longer on our calendar and the time is free again. Any cancellation notice
                comes from our scheduling provider; the details below are for your records.
              </p>
            </div>
          </div>
          <DetailGrid booking={booking} timeZone={timeZone} hourFormat={hourFormat} />
          <div className="scheduler-success-actions">
            <Link to={ROUTES.schedule} className="scheduler-btn accent">Book another time</Link>
            <a href={CONTACT_DETAILS.emailHref} className="scheduler-btn">Email us directly</a>
            <Link to={ROUTES.home} className="scheduler-btn">Return to homepage</Link>
          </div>
        </section>
      </ManageCard>,
      <Header
        label="cancelled"
        title={providerCancelled ? 'Meeting cancelled.' : 'Cancellation complete.'}
        copy="Your meeting is no longer scheduled."
      />,
    )
  }

  if (state.status === 'rescheduling') {
    return shell(
      <NativeScheduler
        mode="reschedule"
        token={token}
        booking={booking}
        onManageToken={(nextToken) => {
          if (!nextToken || nextToken === token) return
          // Cal.com can rotate the UID on reschedule. Keep the address bar in
          // sync so refreshing the page opens the new booking, not the old one.
          const next = new URL(manageUrl(nextToken))
          window.history.replaceState(null, '', `${next.pathname}${next.search}`)
        }}
      />,
      <Header
        label="reschedule"
        title="Choose a new time."
        copy="Your current booking stays in place until the new time is confirmed."
      />,
    )
  }

  const flags = state.flags ?? {}
  const calendar = addToCalendarUrl({
    start: booking.start,
    end: booking.end,
    title: SCHEDULE_EVENT.title,
    description: `Reference: ${booking.reference}`,
    location: booking.meetingUrl || SCHEDULE_EVENT.location,
    meetingUrl: booking.meetingUrl,
  })

  return shell(
    <>
      <ManageCard>
        {info}
        <section className="scheduler-success" aria-labelledby="manage-ready-heading">
          <div className="scheduler-success-head">
            <span className="scheduler-check">
              {isPast ? (
                <CalendarCheck2 aria-hidden="true" strokeWidth={2.4} />
              ) : (
                <Check aria-hidden="true" strokeWidth={2.4} />
              )}
            </span>
            <div>
              <p className="u-eyebrow">{isPast ? 'Meeting ended' : 'Meeting confirmed'}</p>
              <h2 id="manage-ready-heading">
                {isPast ? 'This meeting has passed.' : 'Everything is in place.'}
              </h2>
              <p className="scheduler-success-intro">
                {isPast
                  ? 'The details below are kept for your records. Book a new time whenever you are ready.'
                  : 'Review the details below, or use the actions to change your booking. This signed link works without an account.'}
              </p>
            </div>
          </div>

          <DetailGrid booking={booking} timeZone={timeZone} hourFormat={hourFormat} />

          {actionError && !confirming && (
            <p role="alert" className="scheduler-alert">{actionError}</p>
          )}

          <div className="scheduler-success-actions">
            {!isPast && booking.meetingUrl && (
              <a href={booking.meetingUrl} target="_blank" rel="noreferrer noopener" className="scheduler-btn primary">
                <Video aria-hidden="true" className="h-4 w-4" />
                Open Google Meet
              </a>
            )}
            {!isPast && (
              <a href={calendar} target="_blank" rel="noreferrer noopener" className="scheduler-btn">
                <CalendarCheck2 aria-hidden="true" className="h-4 w-4" />
                Add to calendar
              </a>
            )}
            {flags.canReschedule && (
              <button
                type="button"
                onClick={() => {
                  setActionError(null)
                  setState((current) => ({ ...current, status: 'rescheduling' }))
                }}
                className="scheduler-btn"
              >
                <RotateCw aria-hidden="true" className="h-4 w-4" />
                Reschedule
              </button>
            )}
            {flags.canCancel && (
              <button
                ref={cancelTriggerRef}
                type="button"
                onClick={() => {
                  setActionError(null)
                  setConfirming(true)
                }}
                className="scheduler-btn"
              >
                <CalendarX2 aria-hidden="true" className="h-4 w-4" />
                Cancel meeting
              </button>
            )}
            <Link to={ROUTES.home} className="scheduler-btn">Return to homepage</Link>
          </div>

          {(isPast || (!flags.canCancel && !flags.canReschedule)) && (
            <div className="scheduler-notice">
              <strong>
                {isPast
                  ? 'This meeting has already taken place.'
                  : 'This meeting can no longer be changed here.'}
              </strong>
              <span>
                Write to <a href={CONTACT_DETAILS.emailHref}>{COMPANY.email}</a> and we will help.
              </span>
            </div>
          )}
        </section>
      </ManageCard>

      {confirming && (
        <div className="scheduler-dialog-backdrop" onMouseDown={() => !busy && closeDialog()}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-heading"
            aria-describedby={actionError ? 'cancel-dialog-copy cancel-dialog-error' : 'cancel-dialog-copy'}
            className="scheduler-dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="cancel-dialog-heading">Cancel this meeting?</h2>
            <p id="cancel-dialog-copy">
              This removes the meeting from our calendar and frees the time for somebody else. You
              can book again at any time.
            </p>
            {actionError && (
              <p id="cancel-dialog-error" role="alert" className="scheduler-alert mt-3">{actionError}</p>
            )}
            <label htmlFor="cancel-reason" className="scheduler-control-label mt-4">
              Reason <span className="normal-case tracking-normal">Optional</span>
            </label>
            <textarea
              id="cancel-reason"
              autoFocus
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Let us know why, if you would like to."
            />
            <div className="scheduler-dialog-actions">
              <button type="button" onClick={() => void cancel()} disabled={busy} className="scheduler-btn accent">
                {busy ? (
                  <>
                    <RotateCw aria-hidden="true" className="h-4 w-4 animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  'Yes, cancel this meeting'
                )}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={closeDialog}
                className="scheduler-btn"
              >
                Keep my meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    <Header label="confirmed" title="Your meeting." copy="Review, reschedule or cancel this booking." />,
  )
}
