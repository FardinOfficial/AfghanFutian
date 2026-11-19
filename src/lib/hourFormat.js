/**
 * The scheduler's 12/24-hour choice is a small visitor preference, not a
 * booking detail. Keep it in localStorage so the confirmation and a later
 * management link render the same times the visitor chose on the calendar.
 */
const STORAGE_KEY = 'afghan-futian:schedule-hour-format'

export function readHourFormat() {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === '24' ? '24' : '12'
  } catch {
    return '12'
  }
}

export function saveHourFormat(format) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, format === '24' ? '24' : '12')
  } catch {
    // Private browsing and disabled storage must never break booking.
  }
}
