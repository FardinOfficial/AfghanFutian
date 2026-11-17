import { EASE, gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Reusable scroll-driven effects.
 *
 * Every helper here is a pure function of its inputs: it creates tweens and
 * returns them. Nothing registers global state, and nothing attaches its own
 * cleanup — because all of these are called from inside `useGSAP`, the
 * surrounding `gsap.context` reverts the ScrollTriggers automatically on
 * unmount. That is the single rule that keeps this site leak-free.
 */

/** Shared default so every reveal in the site fires at the same visual moment. */
const DEFAULT_START = 'top 82%'

/**
 * Masked image reveal: the frame clips open from the bottom while the image
 * itself eases back from an oversized scale. Used for every hero-grade image.
 *
 * @param {HTMLElement} frame - overflow-hidden wrapper
 * @param {HTMLElement} image - the <img> inside it
 * @param {{ trigger?: HTMLElement, start?: string, scale?: number }} [options]
 */
export function imageReveal(frame, image, options = {}) {
  if (!frame || prefersReducedMotion()) return null

  const { trigger = frame, start = DEFAULT_START, scale = 1.16 } = options

  const tl = gsap.timeline({
    scrollTrigger: { trigger, start, once: true },
  })

  tl.fromTo(
    frame,
    { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: EASE.architectural },
  )

  if (image) {
    tl.fromTo(image, { scale }, { scale: 1, duration: 1.8, ease: EASE.architectural }, 0)
  }

  return tl
}

/**
 * Vertical parallax. `distance` is a percentage of the element's own height,
 * so the effect scales proportionally across breakpoints.
 *
 * @param {HTMLElement} element
 * @param {{ trigger?: HTMLElement, distance?: number, from?: number }} [options]
 */
export function parallax(element, options = {}) {
  if (!element || prefersReducedMotion()) return null

  const { trigger = element, distance = 12, from = -distance / 2 } = options

  return gsap.fromTo(
    element,
    { yPercent: from },
    {
      yPercent: from + distance,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    },
  )
}

/**
 * Fade-and-rise for a group of elements. Stagger is expressed in seconds so it
 * reads the same regardless of how many children exist.
 *
 * @param {HTMLElement[] | NodeList} elements
 * @param {{ trigger?: HTMLElement, start?: string, y?: number, stagger?: number }} [options]
 */
export function fadeRise(elements, options = {}) {
  const targets = gsap.utils.toArray(elements)
  if (!targets.length) return null

  const { trigger, start = DEFAULT_START, y = 30, stagger = 0.09 } = options

  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0 })
    return null
  }

  return gsap.fromTo(
    targets,
    { y, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: EASE.editorial,
      stagger,
      scrollTrigger: { trigger: trigger ?? targets[0], start, once: true },
    },
  )
}

/**
 * Draw a hairline from left to right. Used to animate the architectural rules
 * that separate sections.
 *
 * `axis: 'y'` draws top-to-bottom instead, for the vertical rail a stacked
 * mobile layout needs. The default is unchanged, so every existing caller keeps
 * its horizontal behaviour.
 *
 * @param {HTMLElement} element
 * @param {{ trigger?: HTMLElement, start?: string, delay?: number, duration?: number, axis?: 'x' | 'y' }} [options]
 */
export function drawRule(element, options = {}) {
  if (!element || prefersReducedMotion()) return null

  const { trigger = element, start = DEFAULT_START, delay = 0, duration = 1.3, axis = 'x' } = options

  const vertical = axis === 'y'

  return gsap.fromTo(
    element,
    vertical
      ? { scaleY: 0, transformOrigin: 'center top' }
      : { scaleX: 0, transformOrigin: 'left center' },
    {
      ...(vertical ? { scaleY: 1 } : { scaleX: 1 }),
      duration,
      delay,
      ease: EASE.architectural,
      scrollTrigger: { trigger, start, once: true },
    },
  )
}

/**
 * Counting numeral for editorial statistics. Animates the text content rather
 * than a transform, and writes a plain string so the DOM stays screen-reader
 * friendly.
 *
 * @param {HTMLElement} element
 * @param {{ value: number, suffix?: string, decimals?: number }} options
 */
export function countUp(element, options) {
  if (!element) return null
  const { value, suffix = '', decimals = 0 } = options

  const format = (n) => `${n.toFixed(decimals)}${suffix}`

  if (prefersReducedMotion()) {
    element.textContent = format(value)
    return null
  }

  const counter = { n: 0 }
  return gsap.to(counter, {
    n: value,
    duration: 1.6,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = format(counter.n)
    },
    scrollTrigger: { trigger: element, start: DEFAULT_START, once: true },
  })
}

/**
 * Pinned horizontal scroll — the process section's desktop behaviour.
 *
 * A wrapper element taller than the viewport is pinned while an inner track is
 * translated on the x-axis. On mobile (or with reduced motion) the wrapper's
 * height collapses and the track falls back to a native vertical stack, so no
 * scroll hijacking ever reaches a touch device.
 *
 * @param {object} config
 * @param {HTMLElement} config.wrapper - the tall element that gets pinned
 * @param {HTMLElement} config.track - the horizontally moving track
 * @param {(progress: number) => void} [config.onProgress]
 * @returns {{ kill: () => void } | null}
 */
export function pinnedHorizontalScroll({ wrapper, track, onProgress }) {
  if (!wrapper || !track || prefersReducedMotion()) return null

  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: wrapper,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => onProgress?.(self.progress),
    },
  })

  return tween
}

/**
 * Pinned step-through: a stack of panels cross-fades as the user scrolls while
 * the section is held in place. This is the mobile-friendly cousin of
 * `pinnedHorizontalScroll`.
 */
export function pinnedSteps({ wrapper, panels, onProgress }) {
  if (!wrapper || !panels?.length || prefersReducedMotion()) return null

  const items = gsap.utils.toArray(panels)
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      start: 'top top',
      end: () => `+=${items.length * 70}%`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => onProgress?.(self.progress),
    },
  })

  items.forEach((panel, index) => {
    if (index === 0) return
    tl.fromTo(
      panel,
      { opacity: 0, yPercent: 6 },
      { opacity: 1, yPercent: 0, duration: 1, ease: 'none' },
      index - 1,
    ).to(
      items[index - 1],
      { opacity: 0, yPercent: -6, duration: 1, ease: 'none' },
      index - 1,
    )
  })

  return tl
}
