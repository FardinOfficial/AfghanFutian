import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Globe2, RotateCw } from 'lucide-react'

import { COMPANY } from '@/data/company.js'
import {
  calendarMonthGrid,
  dateKeyInZone,
  formatSlotRange,
  SCHEDULE_EVENT,
  zoneLabel,
} from '@/lib/scheduling'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad = (value) => String(value).padStart(2, '0')
const keyFor = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`

const MONTH_FORMAT = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function monthLabel(year, month) {
  // Grid keys are UTC dates: formatting a UTC midnight in a western timezone
  // would shift the label to the previous day and sometimes the previous month.
  return MONTH_FORMAT.format(new Date(Date.UTC(year, month, 1)))
}

/**
 * The date and time panels. Selecting a date immediately reveals its real slots;
 * selecting a slot is a separate action so nobody books the first time by
 * accident. Every offered time comes from the live server response.
 */
export default function DateTimeStep({
  timeZone,
  zones,
  onTimeZoneChange,
  hourFormat,
  onHourFormatChange,
  slots,
  activeDate,
  selected,
  onDateSelect,
  onSlotSelect,
  loading,
  error,
  onRetry,
  month,
  onMonthChange,
  window: bookingWindow,
}) {
  const { year, monthIndex } = month
  // Read the clock once per mount so render stays pure and the "today" ring
  // does not flicker between related re-renders.
  const [nowIso] = useState(() => new Date().toISOString())

  const days = useMemo(
    () => calendarMonthGrid(year, monthIndex, 0),
    [year, monthIndex],
  )

  const availableKeys = useMemo(
    () => new Set(Object.keys(slots ?? {}).filter((key) => slots[key]?.length)),
    [slots],
  )
  const selectedKey = useMemo(() => {
    if (!selected?.start) return activeDate ?? ''
    return (
      Object.keys(slots ?? {}).find((key) =>
        slots[key]?.some((slot) => slot.start === selected.start),
      ) ?? activeDate ?? ''
    )
  }, [selected, slots, activeDate])

  const todayKey = dateKeyInZone(nowIso, timeZone)
  const dayHasSlots = (day) => availableKeys.has(keyFor(year, monthIndex, day))
  const currentMonthKey = keyFor(year, monthIndex, 1).slice(0, 7)
  const canGoBack = !bookingWindow?.from || currentMonthKey > bookingWindow.from.slice(0, 7)
  const canGoForward = !bookingWindow?.to || currentMonthKey < bookingWindow.to.slice(0, 7)

  const moveMonth = (delta) => {
    const next = new Date(Date.UTC(year, monthIndex + delta, 1))
    onMonthChange({ year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() })
  }

  const hasAnySlots = availableKeys.size > 0
  const activeSlots = activeDate ? slots?.[activeDate] ?? [] : []
  const slotZone = selected?.start ? zoneLabel(selected.start, timeZone) : ''
  const timeOptions = { hour12: hourFormat === '12' }

  return (
    <>
      <section className="scheduler-panel" aria-labelledby="schedule-calendar-heading">
        <div className="scheduler-panel-head">
          <h2 id="schedule-calendar-heading" className="scheduler-month" aria-live="polite">
            {monthLabel(year, monthIndex)}
          </h2>
          <div className="scheduler-nav">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              disabled={!canGoBack}
              aria-label="Previous month"
            >
              <ChevronLeft aria-hidden="true" strokeWidth={1.7} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              disabled={!canGoForward}
              aria-label="Next month"
            >
              <ChevronRight aria-hidden="true" strokeWidth={1.7} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="scheduler-month-grid"
          key={`${year}-${monthIndex}`}
          aria-label={monthLabel(year, monthIndex)}
        >
          {WEEKDAYS.map((day) => (
            <div key={day} className="scheduler-weekday">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} aria-hidden="true" />
            const key = keyFor(year, monthIndex, day)
            const available = dayHasSlots(day)
            const classes = [
              'scheduler-day',
              available ? 'available' : '',
              key === todayKey ? 'today' : '',
              selectedKey === key ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                key={key}
                type="button"
                disabled={!available}
                aria-label={`${day} ${monthLabel(year, monthIndex)}${available ? ', times available' : ', no times available'}`}
                aria-pressed={selectedKey === key}
                onClick={() => onDateSelect(key)}
                className={classes}
              >
                {day}
                {available && <span className="scheduler-day-dot" aria-hidden="true" />}
              </button>
            )
          })}
        </div>

        <p className="scheduler-legend">
          <i aria-hidden="true" />
          <span>A dot marks a date with real open times.</span>
        </p>
      </section>

      <section className="scheduler-panel" aria-labelledby="schedule-times-heading">
        <div className="scheduler-control">
          <label htmlFor="schedule-timezone" className="scheduler-control-label">
            <span className="flex items-center gap-1.5">
              <Globe2 aria-hidden="true" className="h-3.5 w-3.5" />
              Timezone
            </span>
            <span className="normal-case tracking-normal">{zoneLabel(nowIso, timeZone)}</span>
          </label>
          <select
            id="schedule-timezone"
            value={timeZone}
            onChange={(event) => onTimeZoneChange(event.target.value)}
            className="scheduler-select"
          >
            {zones.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
        </div>

        <div className="scheduler-control">
          <div className="scheduler-control-label" id="schedule-hour-format-label">
            <span>Time format</span>
          </div>
          <div className="scheduler-format" role="group" aria-labelledby="schedule-hour-format-label">
            {['12', '24'].map((format) => (
              <button
                key={format}
                type="button"
                aria-pressed={hourFormat === format}
                onClick={() => onHourFormatChange(format)}
              >
                {format === '12' ? '12 hour' : '24 hour'}
              </button>
            ))}
          </div>
        </div>

        <div className="scheduler-slots-head">
          <h3 id="schedule-times-heading">Available times</h3>
          <span>{SCHEDULE_EVENT.durationMinutes} min</span>
        </div>

        {loading && (
          <div className="scheduler-slot-list" role="status" aria-label="Loading available times">
            {Array.from({ length: 6 }, (_, index) => (
              <span key={index} className="scheduler-skeleton h-10" aria-hidden="true" />
            ))}
            <span className="sr-only">Checking the live calendar…</span>
          </div>
        )}

        {error && (
          <div role="alert" className="scheduler-notice">
            <strong>We could not load availability.</strong>
            <span>{error}</span>
            <button type="button" onClick={onRetry} className="scheduler-text-btn mt-2 inline-flex items-center gap-2">
              <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !hasAnySlots && (
          <div className="scheduler-notice">
            <strong>No open times right now.</strong>
            <span>
              There are no bookable slots in the next 30 days. Email{' '}
              <a href={COMPANY.emailHref}>{COMPANY.email}</a> and we will arrange a time directly.
            </span>
          </div>
        )}

        {!loading && !error && hasAnySlots && !activeDate && (
          <p className="scheduler-notice">Choose a marked date to see its open times.</p>
        )}

        {!loading && !error && activeDate && activeSlots.length === 0 && (
          <p className="scheduler-notice">No times remain on that date. Please choose another marked day.</p>
        )}

        {!loading && !error && activeSlots.length > 0 && (
          <>
            <p className="scheduler-muted mt-3">
              {formatDateLabel(activeDate)} · {slotZone || timeZone}
            </p>
            <div className="scheduler-slot-list">
              {activeSlots.map((slot) => {
                const active = selected?.start === slot.start
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => onSlotSelect(slot)}
                    aria-pressed={active}
                    className="scheduler-slot"
                  >
                    {formatSlotRange(slot.start, slot.end, timeZone, timeOptions)}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </section>
    </>
  )
}

function formatDateLabel(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
