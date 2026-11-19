import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock3, Globe2, RotateCw } from 'lucide-react'

import { formatSlotRange, SCHEDULE_EVENT, zoneLabel } from '@/lib/scheduling'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const pad = (value) => String(value).padStart(2, '0')
const keyFor = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`

const MONTH_FORMAT = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function monthLabel(year, month) {
  // The grid keys are UTC date strings. Formatting a UTC midnight in the
  // browser's local zone would shift it to the previous day (and month) for
  // every visitor west of Greenwich.
  return MONTH_FORMAT.format(new Date(Date.UTC(year, month, 1)))
}

/**
 * The date and time step. Every day with a dot has at least one real slot
 * returned by the server for the currently selected timezone. Days without a
 * dot are not offered — there is no invented availability here.
 */
export default function DateTimeStep({
  timeZone,
  zones,
  onTimeZoneChange,
  slots,
  selected,
  onSelect,
  loading,
  error,
  onRetry,
  month,
  onMonthChange,
  window: bookingWindow,
}) {
  const { year, monthIndex } = month

  const days = useMemo(() => {
    const first = new Date(Date.UTC(year, monthIndex, 1))
    const offset = (first.getUTCDay() + 6) % 7 // Monday-first grid
    const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ]
  }, [year, monthIndex])

  // The API groups slots in the visitor's timezone; the visible calendar is a
  // plain Gregorian grid, so matching is done on the returned date key.
  const availableKeys = useMemo(
    () => new Set(Object.keys(slots ?? {}).filter((key) => slots[key]?.length)),
    [slots],
  )
  const selectedKey = useMemo(() => {
    if (!selected?.start) return ''
    return (
      Object.keys(slots ?? {}).find((key) => slots[key]?.some((slot) => slot.start === selected.start)) ??
      ''
    )
  }, [selected, slots])
  const dayHasSlots = (day) => availableKeys.has(keyFor(year, monthIndex, day))

  const currentMonthKey = keyFor(year, monthIndex, 1).slice(0, 7)
  const canGoBack = !bookingWindow?.from || currentMonthKey > bookingWindow.from.slice(0, 7)
  const canGoForward = !bookingWindow?.to || currentMonthKey < bookingWindow.to.slice(0, 7)

  const moveMonth = (delta) => {
    const next = new Date(Date.UTC(year, monthIndex + delta, 1))
    onMonthChange({ year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() })
  }

  const selectedDaySlots = selectedKey ? slots?.[selectedKey] ?? [] : []
  const slotZone = selected?.start ? zoneLabel(selected.start, timeZone) : ''

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            disabled={!canGoBack}
            aria-label="Previous month"
            className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-ink disabled:opacity-30"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <p className="font-display text-[1.125rem] font-medium tabular-nums" aria-live="polite">
            {monthLabel(year, monthIndex)}
          </p>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            disabled={!canGoForward}
            aria-label="Next month"
            className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-ink disabled:opacity-30"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-7 grid grid-cols-7 gap-px border border-line bg-line" role="grid">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              role="columnheader"
              className="bg-surface px-1 py-3 text-center text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-strong"
            >
              {day}
            </div>
          ))}
          {days.map((day, index) =>
            day === null ? (
              <div key={`blank-${index}`} role="gridcell" className="bg-canvas" />
            ) : (
              <button
                key={day}
                type="button"
                role="gridcell"
                onClick={() => {
                  const key = keyFor(year, monthIndex, day)
                  const first = slots?.[key]?.[0]
                  onSelect(first ?? null)
                }}
                disabled={!dayHasSlots(day)}
                aria-label={`${day} ${monthLabel(year, monthIndex)}${dayHasSlots(day) ? ', times available' : ', no times available'}`}
                className={`relative flex aspect-square min-h-[2.75rem] items-center justify-center bg-canvas font-sans text-[0.8125rem] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink ${
                  dayHasSlots(day) ? 'text-ink hover:bg-surface' : 'cursor-not-allowed text-muted-strong/45'
                } ${selectedKey === keyFor(year, monthIndex, day) ? 'bg-ink text-canvas hover:bg-ink' : ''}`}
              >
                {day}
                {dayHasSlots(day) && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1.5 h-[4px] w-[4px] rounded-full ${selectedKey === keyFor(year, monthIndex, day) ? 'bg-accent' : 'bg-ink/70'}`}
                  />
                )}
              </button>
            ),
          )}
        </div>

        <p className="mt-4 flex items-center gap-2 text-[0.75rem] leading-snug text-muted-strong">
          <span aria-hidden="true" className="h-[4px] w-[4px] rounded-full bg-ink/70" />
          A dot means real open times on that date.
        </p>
      </div>

      <div className="lg:col-span-5">
        <div className="flex items-center gap-2">
          <Globe2 aria-hidden="true" className="h-4 w-4 text-muted-strong" />
          <label htmlFor="schedule-timezone" className="u-eyebrow">
            Your timezone
          </label>
        </div>
        <select
          id="schedule-timezone"
          value={timeZone}
          onChange={(event) => onTimeZoneChange(event.target.value)}
          className="mt-3 w-full border border-line bg-transparent px-4 py-3.5 font-sans text-[0.9375rem] text-ink focus:border-ink focus:outline-none"
        >
          {zones.map((zone) => (
            <option key={zone.value} value={zone.value}>
              {zone.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[0.75rem] leading-snug text-muted-strong">
          All times below are shown in {timeZone.replaceAll('_', ' ')}.
        </p>

        <div className="mt-9 border-t border-line pt-7">
          <div className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-muted-strong" />
            <h3 className="u-eyebrow">Available times</h3>
          </div>

          {loading && (
            <p role="status" className="mt-5 text-[0.875rem] text-muted-strong">
              Checking the live calendar…
            </p>
          )}

          {error && (
            <div role="alert" className="mt-5">
              <p className="text-[0.875rem] leading-relaxed text-ink">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 border border-ink px-4 py-2.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-canvas"
              >
                <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          )}

          {!loading && !error && !selected && (
            <p className="mt-5 text-[0.875rem] leading-relaxed text-muted-strong">
              Choose a marked date to see its open times.
            </p>
          )}

          {!loading && !error && selected && selectedDaySlots.length === 0 && (
            <p className="mt-5 text-[0.875rem] leading-relaxed text-muted-strong">
              No times remain on that date. Please choose another marked day.
            </p>
          )}

          {!loading && selectedDaySlots.length > 0 && (
            <>
              <p className="mt-5 text-[0.8125rem] text-muted-strong">
                {SCHEDULE_EVENT.durationMinutes} minutes · {slotZone || timeZone}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {selectedDaySlots.map((slot) => {
                  const active = selected?.start === slot.start
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => onSelect(slot)}
                      aria-pressed={active}
                      className={`border px-2 py-3 font-sans text-[0.8125rem] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                        active
                          ? 'border-ink bg-ink text-canvas'
                          : 'border-line text-ink hover:border-ink'
                      }`}
                    >
                      {formatSlotRange(slot.start, slot.end, timeZone)}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
