import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarX2, Check, RotateCw, ShieldCheck } from 'lucide-react'

import Button from '@/components/Button'
import PageHero from '@/components/PageHero'
import SectionIntro from '@/components/SectionIntro'
import NativeScheduler from '@/components/NativeScheduler'
import { COMPANY } from '@/data/company.js'
import { CONTACT_DETAILS, ROUTES } from '@/data/navigation'
import {
  ScheduleApiError,
  cancelBooking,
  fetchManage,
  SCHEDULE_ERROR_COPY,
} from '@/lib/scheduleApi'
import { formatDate, formatSlotRange, zoneLabel } from '@/lib/scheduling'

/**
 * ManageBookingPage — the destination of the signed link in a confirmation
 * email. No account and no login: the token in the URL is the proof that the
 * visitor is the attendee. It is bound to both the booking UID and the email
 * address at signing time, and the server re-checks both before any change.
 */
export default function ManageBookingPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [state, setState] = useState(() => ({
    status: token ? 'loading' : 'error',
    booking: null,
    flags: null,
  }))
  const [error, setError] = useState(() =>
    token ? null : SCHEDULE_ERROR_COPY.invalid_link,
  )
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

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

    return () => {
      active = false
    }
  }, [token])

  const cancel = async () => {
    if (!state.booking) return
    setBusy(true)
    setActionError(null)
    try {
      await cancelBooking({
        token,
        uid: state.booking.uid,
        reason: reason.trim() || 'Cancelled by attendee via the website',
      })
      setState((current) => ({ ...current, status: 'cancelled' }))
      setConfirming(false)
    } catch (caught) {
      const kind = caught instanceof ScheduleApiError ? caught.kind : 'server'
      setActionError(SCHEDULE_ERROR_COPY[kind] ?? SCHEDULE_ERROR_COPY.server)
    } finally {
      setBusy(false)
    }
  }

  const header = (
    <PageHero
      index="09"
      label="Manage meeting"
      title="Your meeting."
      description="Use the signed link from your booking confirmation to change or cancel a meeting. Nothing here asks you to create an account."
    >
      <ul className="mt-9 space-y-5 border-t border-line-invert pt-7">
        <li className="flex items-start gap-4">
          <ShieldCheck aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 text-accent" />
          <p className="max-w-[38ch] text-sm leading-relaxed text-canvas/85">
            This link is signed for one booking and one email address. It cannot be reused for
            somebody else’s meeting.
          </p>
        </li>
        <li>
          <p className="u-eyebrow text-canvas-muted">Need help</p>
          <a href={CONTACT_DETAILS.emailHref} className="u-link mt-2 text-sm text-canvas/85">
            {CONTACT_DETAILS.email}
          </a>
        </li>
      </ul>
    </PageHero>
  )

  if (state.status === 'loading') {
    return (
      <>
        {header}
        <SectionIntro
          index="01"
          label="Loading"
          heading="Checking your link…"
          support="We are reading the booking from our calendar now."
        >
          <p role="status" className="mt-10 text-[0.9375rem] text-muted-strong">
            One moment…
          </p>
        </SectionIntro>
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        {header}
        <SectionIntro
          index="01"
          label="Link unavailable"
          heading="We could not open that booking."
          support={error || SCHEDULE_ERROR_COPY.invalid_link}
        >
          <div className="mt-10 flex flex-wrap gap-3">
            <Button to={ROUTES.contact} variant="accent" size="lg">
              Contact us
            </Button>
            <Button to={ROUTES.schedule} variant="outline" size="lg" icon={false}>
              Book a new meeting
            </Button>
          </div>
        </SectionIntro>
      </>
    )
  }

  if (state.status === 'cancelled' && state.booking) {
    const booking = state.booking
    return (
      <>
        {header}
        <SectionIntro
          index="01"
          label="Cancelled"
          heading="The meeting has been cancelled."
          support="It has been removed from our calendar. The time is free again, and you will receive a confirmation by email."
        >
          <div className="mt-10 max-w-[44rem] border border-line bg-surface p-7 sm:p-9">
            <dl className="grid gap-px bg-line sm:grid-cols-2">
              {[
                ['Was scheduled for', formatDate(booking.start, booking.timeZone)],
                [
                  'Time',
                  `${formatSlotRange(booking.start, booking.end, booking.timeZone)} ${zoneLabel(booking.start, booking.timeZone)}`,
                ],
                ['Reference', booking.reference],
                ['Host', COMPANY.legalName],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface px-5 py-4">
                  <dt className="u-eyebrow text-muted-strong">{label}</dt>
                  <dd className="mt-2 text-[0.9375rem] text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-7">
              <Button to={ROUTES.schedule} variant="accent" size="lg">
                Book another time
              </Button>
              <a href={CONTACT_DETAILS.emailHref} className="u-link px-3 py-4 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink">
                Email us directly
              </a>
            </div>
          </div>
        </SectionIntro>
      </>
    )
  }

  if (state.status === 'rescheduling' && state.booking) {
    return (
      <>
        {header}
        <SectionIntro
          index="01"
          label="Reschedule"
          heading="Choose a new time."
          support="Your current booking stays in place until the new time is confirmed. Your old time remains available to you while you choose."
        >
          <div className="mt-10 max-w-[62rem]">
            <NativeScheduler mode="reschedule" token={token} booking={state.booking} />
          </div>
        </SectionIntro>
      </>
    )
  }

  const booking = state.booking
  const flags = state.flags ?? {}

  return (
    <>
      {header}
      <SectionIntro
        index="01"
        label="Confirmed"
        heading="Everything is in place."
        support="Review the details below, or use the actions here to change your booking."
      >
        <div className="mt-10 max-w-[44rem] border border-line bg-surface p-7 sm:p-9">
          <div className="flex items-start gap-4 border-b border-line pb-7">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-accent text-ink">
              <Check strokeWidth={2.4} className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-[1.25rem] font-medium leading-snug">
                {formatDate(booking.start, booking.timeZone)}
              </p>
              <p className="mt-2 text-[0.9375rem] tabular-nums text-muted-strong">
                {formatSlotRange(booking.start, booking.end, booking.timeZone)}{' '}
                {zoneLabel(booking.start, booking.timeZone)}
              </p>
            </div>
          </div>

          <dl className="grid gap-px bg-line sm:grid-cols-2">
            {[
              ['Reference', booking.reference],
              ['Duration', '30 minutes'],
              ['Location', booking.meetingUrl ? 'Google Meet' : 'To be confirmed by email'],
              ['Attendee', booking.name || 'You'],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface px-5 py-4">
                <dt className="u-eyebrow text-muted-strong">{label}</dt>
                <dd className="mt-2 break-words text-[0.9375rem] text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {booking.meetingUrl && (
            <a
              href={booking.meetingUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="u-link mt-7 inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Open Google Meet
            </a>
          )}

          {actionError && (
            <p role="alert" className="mt-7 border-l-2 border-ink pl-4 text-[0.875rem] leading-relaxed text-ink">
              {actionError}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-7">
            {flags.canReschedule && (
              <Button
                onClick={() => {
                  setActionError(null)
                  setState((current) => ({ ...current, status: 'rescheduling' }))
                }}
                variant="accent"
                size="lg"
                icon={false}
              >
                <RotateCw aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
                Reschedule
              </Button>
            )}

            {flags.canCancel && !confirming && (
              <Button
                onClick={() => {
                  setActionError(null)
                  setConfirming(true)
                }}
                variant="outline"
                size="lg"
                icon={false}
              >
                <CalendarX2 aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
                Cancel meeting
              </Button>
            )}
          </div>

          {confirming && (
            <div className="mt-8 border-t border-line pt-7">
              <label htmlFor="cancel-reason" className="u-eyebrow text-ink">
                Reason for cancellation <span className="text-muted-strong">Optional</span>
              </label>
              <textarea
                id="cancel-reason"
                rows={3}
                maxLength={300}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-3 w-full border border-line bg-transparent px-4 py-3 font-sans text-[0.9375rem] focus:border-ink focus:outline-none"
                placeholder="Let us know why, if you would like to."
              />
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy}
                  className="inline-flex items-center gap-2 bg-ink px-6 py-4 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-ink/85 disabled:opacity-50"
                >
                  {busy ? 'Cancelling…' : 'Yes, cancel this meeting'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false)
                    setReason('')
                    setActionError(null)
                  }}
                  disabled={busy}
                  className="px-4 py-4 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-strong transition-colors hover:text-ink disabled:opacity-50"
                >
                  Keep my meeting
                </button>
              </div>
            </div>
          )}

          {!flags.canCancel && !flags.canReschedule && (
            <p className="mt-8 border-t border-line pt-7 text-[0.875rem] leading-relaxed text-muted-strong">
              This meeting can no longer be changed here. Write to{' '}
              <a href={CONTACT_DETAILS.emailHref} className="u-link text-ink">
                {CONTACT_DETAILS.email}
              </a>{' '}
              and we will help.
            </p>
          )}
        </div>

        <p className="mt-8 text-[0.8125rem] leading-relaxed text-muted-strong">
          <Link to={ROUTES.schedule} className="u-link text-ink">
            Book a different meeting
          </Link>
        </p>
      </SectionIntro>
    </>
  )
}
