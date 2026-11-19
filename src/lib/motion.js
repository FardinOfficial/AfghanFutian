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

/** Matches Tailwind's `lg` breakpoint — the desktop/mobile divide for layout. */
export function isDesktopViewport() {
  if (!canUseDOM) return false
  return window.matchMedia('(min-width: 1024px)').matches
}

/**
 * Matches Tailwind's `xl` breakpoint — the width at which the header's desktop
 * cluster (five nav links plus both calls to action) fits on one line.
 *
 * It is not `lg`: measured against the loaded webfonts, that cluster needs
 * about 1155px of inner width, and at `lg` (1024px) the container only offers
 * ~932px. The labels then wrapped to two lines and the bar grew taller. `xl`
 * leaves ~27px of slack, so the row holds together with the fonts still
 * settling. Anything narrower gets the overlay menu, which is a better fit for
 * a tablet or a small laptop anyway.
 */
export const BREAKPOINT_XL = '(min-width: 1280px)'

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
