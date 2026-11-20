import { memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import { isLocale } from '@/i18n/routing'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * ScrollProgress.
 *
 * A 3px accent hairline pinned to the very top of the viewport, whose length is
 * the fraction of the page already read. The existing component is repaired in
 * place: it now uses the site's single GSAP/ScrollTrigger registry instead of a
 * second scroll loop, follows the active text direction, and disappears on
 * pages that cannot scroll.
 *
 * Measurement
 * ----------------------------------------------------------------------------
 * The trigger runs from absolute scroll position 0 to `max` (the browser's
 * maximum scroll for the current document), so the tween's progress is exactly
 * the page's scroll fraction: 0 at the top, 0.5 halfway, 1 at the bottom. There
 * is no timer and no synthetic easing — `scrub: true` is a direct read-out of
 * the scroll position. The smoothness visitors feel comes from Lenis, which is
 * already disabled for reduced-motion users by SmoothScrollProvider.
 *
 * `scaleX` is a compositor transform, so repainting never touches layout. The
 * transform origin is switched to the right for Pashto and Dari, which makes
 * the same 0→1 tween fill right-to-left without a second animation.
 *
 * Lifetime
 * ----------------------------------------------------------------------------
 * The component is mounted once in MainLayout. `pathname` and the derived RTL
 * flag are the only dependencies: a route change or a language switch reverts
 * the previous GSAP context (killing its trigger) and rebuilds it against the
 * new document height. A body ResizeObserver handles late images, font swaps
 * and any other content-driven height change. Nothing is stored in React state,
 * so scrolling never re-renders the component.
 *
 * Accessibility
 * ----------------------------------------------------------------------------
 * Purely decorative: `aria-hidden`, `pointer-events: none`, and it never
 * displaces layout. It is not focusable and announces nothing.
 */
function ScrollProgress() {
  const trackRef = useRef(null)
  const barRef = useRef(null)
  const { i18n } = useTranslation()
  const { pathname } = useLocation()

  const resolvedLocale = i18n.resolvedLanguage ?? i18n.language ?? 'en'
  const locale = isLocale(resolvedLocale) ? resolvedLocale : 'en'
  const isRtl = locale !== 'en'

  useGSAP(
    () => {
      const track = trackRef.current
      const bar = barRef.current
      if (!track || !bar) return undefined

      gsap.set(bar, { transformOrigin: isRtl ? '100% 50%' : '0% 50%' })

      // `end: 'max'` can resolve to a non-zero sentinel on a document that is
      // exactly one viewport tall, so use the real measurement for visibility.
      const syncVisibility = () => {
        track.hidden = document.documentElement.scrollHeight <= window.innerHeight
      }

      const tween = gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          overwrite: 'auto',
          scrollTrigger: {
            trigger: document.body,
            start: 0,
            end: 'max',
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: syncVisibility,
          },
        },
      )

      let refreshFrame = 0
      const refresh = () => {
        if (refreshFrame) return
        refreshFrame = requestAnimationFrame(() => {
          refreshFrame = 0
          syncVisibility()
          tween.scrollTrigger?.refresh()
        })
      }

      const observer = new ResizeObserver(refresh)
      observer.observe(document.body)
      window.addEventListener('load', refresh)

      return () => {
        observer.disconnect()
        window.removeEventListener('load', refresh)
        if (refreshFrame) cancelAnimationFrame(refreshFrame)
      }
    },
    { dependencies: [pathname, isRtl], revertOnUpdate: true },
  )

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      data-scroll-progress-track
      className="pointer-events-none fixed inset-x-0 top-0 z-[105] h-[3px] overflow-hidden"
    >
      <div
        ref={barRef}
        data-scroll-progress
        className={`h-full w-full scale-x-0 bg-accent will-change-transform ${
          isRtl ? 'origin-right' : 'origin-left'
        }`}
      />
    </div>
  )
}

export default memo(ScrollProgress)
