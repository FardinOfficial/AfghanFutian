/**
 * Environment + capability helpers.
 *
 * All of these are evaluated lazily and guard against SSR / non-browser
 * execution so they are safe to call at module scope in future environments.
 */

const canUseDOM = typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/** Honour the user's operating-system motion preference. */
export function prefersReducedMotion() {
  if (!canUseDOM) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** True when the primary input cannot hover precisely (touch phones/tablets). */
export function isCoarsePointer() {
  if (!canUseDOM) return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

/**
 * The bespoke cursor is only meaningful with a precise, hovering pointer.
 * Touch devices, reduced-motion users and small screens all opt out.
 */
export function shouldEnableCustomCursor() {
  if (!canUseDOM) return false
  if (prefersReducedMotion()) return false
  if (isCoarsePointer()) return false
  return window.matchMedia('(min-width: 1024px)').matches
}

/** Matches Tailwind's `lg` breakpoint — the desktop/mobile divide for layout. */
export function isDesktopViewport() {
  if (!canUseDOM) return false
  return window.matchMedia('(min-width: 1024px)').matches
}

export const BREAKPOINT_LG = '(min-width: 1024px)'

/** Subscribe to a media query, returning an unsubscribe function. */
export function onMediaChange(query, handler) {
  if (!canUseDOM) return () => {}
  const mql = window.matchMedia(query)
  const listener = (event) => handler(event.matches)
  mql.addEventListener('change', listener)
  handler(mql.matches)
  return () => mql.removeEventListener('change', listener)
}

/** Clamp helper used by a few scroll-driven calculations. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
