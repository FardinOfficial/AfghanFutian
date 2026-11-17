import { EASE, SplitText } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Accessible text splitting.
 *
 * GSAP's SplitText ships with `aria: 'auto'`, which stamps an `aria-label`
 * holding the original string onto the source element and hides the generated
 * line/word wrappers from assistive technology. Screen readers therefore
 * announce the sentence once, exactly as authored — never the chopped-up
 * fragments. This is why we do not hand-roll a splitter.
 *
 * `aria: 'auto'` is only valid where the element accepts an accessible name.
 * On a heading it is ideal. On a `<p>` it is not: `aria-label` is *prohibited*
 * on role `paragraph`, and axe (via Lighthouse) fails the page for it. For
 * those targets pass `aria: 'none'`, which leaves the DOM untouched by ARIA —
 * the line wrappers then read in source order, which is the sentence as
 * written. `aria: 'hidden'` is never what we want: it would silence the copy.
 *
 * This module is deliberately presentation-free: it only ever *prepares* text.
 * Animating it is the caller's job, which keeps timelines readable and makes
 * reduced-motion handling a single decision instead of many.
 */

/** Track splits per element so re-splitting and teardown are leak-free. */
const splitRegistry = new WeakMap()

/**
 * Split an element into masked lines.
 *
 * `mask: 'lines'` wraps each line in an overflow-hidden container, letting the
 * inner line slide up from behind the baseline. This is the core reveal
 * gesture of the site.
 *
 * @param {HTMLElement | null} element
 * @param {{ autoSplit?: boolean, aria?: 'auto' | 'hidden' | 'none' }} [options]
 * @returns {SplitText | null} `null` when splitting is skipped (reduced motion).
 */
export function splitLines(element, options = {}) {
  if (!element || prefersReducedMotion()) return null

  splitRegistry.get(element)?.revert()

  const split = SplitText.create(element, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'line-inner',
    // 'auto' names the source element and hides the wrappers. Callers pass
    // 'none' for elements where `aria-label` is prohibited (e.g. <p>).
    aria: options.aria ?? 'auto',
    // Re-flow lines when the webfont loads or the viewport changes width.
    autoSplit: options.autoSplit ?? true,
  })

  splitRegistry.set(element, split)
  return split
}

/**
 * Split an element into words (and lines). Used sparingly — reserved for short,
 * high-impact statements where a word-by-word cadence earns its keep.
 */
export function splitWords(element, options = {}) {
  if (!element || prefersReducedMotion()) return null

  splitRegistry.get(element)?.revert()

  const split = SplitText.create(element, {
    type: 'words,lines',
    mask: 'lines',
    linesClass: 'line-inner',
    wordsClass: 'word-inner',
    aria: options.aria ?? 'auto',
    autoSplit: options.autoSplit ?? true,
  })

  splitRegistry.set(element, split)
  return split
}

/** Release the SplitText instance attached to an element, restoring the DOM. */
export function revertSplit(element) {
  const split = splitRegistry.get(element)
  if (!split) return
  split.revert()
  splitRegistry.delete(element)
}

/**
 * Queue a masked line reveal onto an existing timeline.
 *
 * @param {gsap.core.Timeline} tl
 * @param {HTMLElement | null} element
 * @param {{ position?: gsap.Position, stagger?: number, duration?: number, delay?: number, aria?: 'auto' | 'hidden' | 'none' }} [options]
 * @returns {gsap.core.Timeline} the same timeline, for chaining
 */
export function addLineReveal(tl, element, options = {}) {
  const { position = 0, stagger = 0.085, duration = 1.15, delay = 0, aria } = options
  if (!element) return tl

  const split = splitLines(element, { aria })
  const lines = split?.lines ?? []

  if (!lines.length) {
    // Reduced motion, or an unsplittable element: fade in instead of sliding so
    // the content still arrives, just quietly.
    tl.fromTo(
      element,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: EASE.editorial, delay },
      position,
    )
    return tl
  }

  tl.fromTo(
    lines,
    { yPercent: 115 },
    { yPercent: 0, duration, ease: EASE.reveal, stagger, delay },
    position,
  )

  return tl
}

/** Reveal a set of lines that were split separately, as one staggered group. */
export function addLinesReveal(tl, elements, options = {}) {
  const targets = (Array.isArray(elements) ? elements : [elements]).filter(Boolean)
  const { stagger = 0.085, duration = 1.15, delay = 0, aria } = options

  let cursor = 0
  targets.forEach((element) => {
    addLineReveal(tl, element, { position: cursor, stagger, duration, delay, aria })
    const lineCount = splitRegistry.get(element)?.lines?.length ?? 1
    cursor += lineCount * stagger + 0.04
  })

  return tl
}
