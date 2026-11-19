import { useEffect, useRef } from 'react'

/**
 * ScrollProgress.
 *
 * A 3px accent hairline pinned to the very top of the viewport, whose length is
 * the fraction of the page already read. It is the only element on the site that
 * is deliberately *not* animated with GSAP: it has to stay correct on routes of
 * wildly different heights, and it must not participate in the ScrollTrigger
 * refresh cycle, so it is driven by the native scroll position instead.
 *
 * Why `scaleX` rather than `width`
 * ----------------------------------------------------------------------------
 * `width` forces layout on every frame. A left-anchored `scaleX` is a compositor
 * transform, so the bar can be repainted on the GPU without touching layout, and
 * it produces exactly the same pixels for a solid fill. `will-change: transform`
 * is set for the same reason.
 *
 * Why the measurement is separate from the paint
 * ----------------------------------------------------------------------------
 * `scrollHeight` is a forced synchronous layout read. Reading it on every scroll
 * event is the classic way to make a page janky, so it is measured only when the
 * document can actually have changed size — a resize, a route commit, a late
 * image decode or a webfont swap — and the scroll handler only ever *reads*
 * `scrollY` and writes one transform.
 *
 * Lenis compatibility
 * ----------------------------------------------------------------------------
 * Lenis scrolls the real window rather than translating a wrapper, so `scrollY`
 * and the native `scroll` event stay accurate while smoothing is active. No
 * coupling to the Lenis instance is needed.
 *
 * Accessibility
 * ----------------------------------------------------------------------------
 * Purely decorative: `aria-hidden`, `pointer-events: none`, and it never
 * displaces layout. It is not a focusable control and it announces nothing.
 * Under `prefers-reduced-motion` it still works — it is a direct read-out of the
 * reader's own scroll position, not an animation played at them.
 */
export default function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return undefined

    /** Pixels of scroll available. Recalculated only when the document resizes. */
    let range = 0
    /** Pending `requestAnimationFrame` handle, or 0 when none is scheduled. */
    let frame = 0

    const measure = () => {
      range = document.documentElement.scrollHeight - window.innerHeight
    }

    const paint = () => {
      frame = 0
      const y = window.scrollY || document.documentElement.scrollTop || 0
      const progress = range > 0 ? Math.min(1, Math.max(0, y / range)) : 0
      bar.style.transform = `scaleX(${progress})`
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(paint)
    }

    const remeasure = () => {
      measure()
      schedule()
    }

    remeasure()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure, { passive: true })
    window.addEventListener('load', remeasure)

    // The body's box tracks its content, unlike `documentElement`, whose box is
    // always viewport-height. Watching it catches route commits, image decodes
    // and font swaps without polling.
    const observer = new ResizeObserver(remeasure)
    observer.observe(document.body)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('load', remeasure)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      data-scroll-progress-track
      className="pointer-events-none fixed inset-x-0 top-0 z-[105] h-[3px] overflow-hidden"
    >
      <div
        ref={barRef}
        data-scroll-progress
        className="h-full w-full origin-left scale-x-0 bg-accent will-change-transform"
      />
    </div>
  )
}
