import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

import { ScrollTrigger, gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Lenis ⇄ GSAP ScrollTrigger integration.
 *
 * The two systems are synchronised the officially recommended way:
 *   • Lenis drives `window` scrolling itself, so no ScrollTrigger
 *     `scrollerProxy` is required.
 *   • `lenis.on('scroll', ScrollTrigger.update)` keeps every trigger in step
 *     with the interpolated scroll position.
 *   • Lenis' RAF loop is *not* its own (`autoRaf: false`); GSAP's ticker drives
 *     it instead, so Lenis and every tween resolve in the same frame. Two
 *     independent RAF loops is the classic cause of jittery pinned sections.
 *   • `lagSmoothing(0)` stops GSAP from "catching up" after a long frame, which
 *     would otherwise jump the scroll position.
 *
 * Lenis is deliberately *not* enabled when the user prefers reduced motion —
 * smoothing is exactly the kind of motion that preference asks us to remove.
 */

const LenisContext = createContext(null)

export function SmoothScrollProvider({ children }) {
  const [lenis, setLenis] = useState(null)
  const lenisRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return undefined

    const instance = new Lenis({
      duration: 1.05,
      // A gentle exponential ease — long enough to feel considered, short
      // enough that the page never feels disconnected from the input.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch scrolling stays native. Intercepting it fights the OS and
      // breaks momentum, pull-to-refresh and accessibility gestures.
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
      autoRaf: false,
    })

    lenisRef.current = instance
    setLenis(instance)

    const onScroll = () => ScrollTrigger.update()
    instance.on('scroll', onScroll)

    const raf = (time) => instance.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      instance.off('scroll', onScroll)
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      instance.destroy()
      lenisRef.current = null
      setLenis(null)
    }
  }, [])

  useDimensionSync(lenis)

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

/**
 * Keep Lenis' cached dimensions honest.
 *
 * Lenis measures the document once and then relies on a `ResizeObserver` — but
 * it observes `document.documentElement`, whose *box* is always viewport-height
 * even when the content overflows it. The observer therefore never fires when
 * the page grows, `limit` stays frozen at its initial value, and Lenis simply
 * refuses to scroll past it. (Measured in this project: wheel input set Lenis'
 * `isScrolling` flag but moved the page 0px.)
 *
 * The page grows in several normal situations — the route body committing a
 * frame after the layout, images decoding, the preloader unmounting, fonts
 * swapping — so we watch `document.body`, whose box *does* track its content,
 * and re-measure both Lenis and ScrollTrigger when it changes.
 *
 * Guarded against feedback loops by comparing heights, and debounced so a burst
 * of image decodes triggers one re-measure rather than ten.
 */
function useDimensionSync(lenis) {
  useEffect(() => {
    if (!lenis) return undefined

    let frame = 0
    let timer = 0
    let lastHeight = document.body.scrollHeight

    const measure = () => {
      lenis.resize()
      ScrollTrigger.refresh()
    }

    const observer = new ResizeObserver(() => {
      const height = document.body.scrollHeight
      if (height === lastHeight) return
      lastHeight = height

      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        cancelAnimationFrame(frame)
        frame = window.requestAnimationFrame(measure)
      }, 120)
    })

    observer.observe(document.body)

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [lenis])
}

/** Access the active Lenis instance (may be `null` under reduced motion). */
export function useLenis() {
  return useContext(LenisContext)
}

/**
 * Distance held back from an anchor target so the fixed navbar never covers the
 * heading it just scrolled to.
 *
 * Kept in step with `section[id] { scroll-margin-top }` in
 * `src/styles/index.css`, which covers the native-hash fallback for the moment
 * before hydration. The two are the *same* clearance, but it is applied once per
 * path: see `jump()` below for why the offset is resolved to an absolute scroll
 * position rather than handed to Lenis as an element plus an offset.
 */
const ANCHOR_OFFSET = -96

/** `querySelector` throws on a malformed selector; a bad hash must not break. */
function findAnchor(hash) {
  if (!hash || !hash.startsWith('#')) return null
  try {
    return document.querySelector(hash)
  } catch {
    return null
  }
}

/**
 * Reset scroll on route change — or, when the URL carries a hash, jump to that
 * anchor instead — then refresh ScrollTrigger once the new page has settled.
 *
 * The hash branch is what makes in-page links such as `/#process` work from
 * another route. Without it the router changes the URL, this effect scrolls to
 * the top, and the anchor is silently ignored.
 *
 * The anchor is resolved to an absolute scroll position rather than passed to
 * Lenis as an element. Lenis honours the target's own `scroll-margin-top` *and*
 * adds the `offset` it is given, so handing it the element with `offset:
 * ANCHOR_OFFSET` applies the navbar clearance twice — the target landed roughly
 * 184px down the page instead of 96px. A numeric target is unambiguous, and it
 * makes the Lenis path and the native fallback behave identically.
 *
 * `ScrollTrigger.refresh()` must run *after* the browser has laid out the new
 * page, otherwise pinned sections measure a stale height. Anchors are resolved
 * twice for the same reason: once immediately, and once after refresh, because
 * an anchor's position can move when the sections above it are measured.
 */
export function useScrollReset(pathname, hash) {
  const lenis = useLenis()
  const isFirstRender = useRef(true)

  useEffect(() => {
    const jump = () => {
      const anchor = findAnchor(hash)

      if (anchor) {
        const top = Math.max(
          0,
          anchor.getBoundingClientRect().top + window.scrollY + ANCHOR_OFFSET,
        )

        if (lenis) {
          lenis.scrollTo(top, { immediate: true, force: true })
        } else {
          window.scrollTo({ top, behavior: 'auto' })
        }
        return
      }

      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true })
      } else {
        window.scrollTo(0, 0)
      }
    }

    jump()

    // The new route's DOM may not be laid out yet, so re-measure on the next
    // frame as well as immediately.
    lenis?.resize()

    const id = window.requestAnimationFrame(() => {
      lenis?.resize()
      ScrollTrigger.refresh()
      // Layout has settled: land on the anchor precisely.
      if (hash) jump()
    })
    return () => window.cancelAnimationFrame(id)
  }, [pathname, hash, lenis])

  /**
   * Route-change focus management.
   *
   * A client-side navigation swaps the page body without a document load, so the
   * browser never moves focus and a keyboard or screen-reader user is left
   * parked on the link they just activated — with the new content behind them.
   * Moving focus to the `<main>` landmark is the standard remedy.
   *
   * Three deliberate choices:
   *   • `preventScroll: true`, because the scroll position is already handled
   *     above and letting the browser scroll to `main` would fight it.
   *   • Skipped on the first render. On a fresh load focus belongs at the top of
   *     the document; stealing it into `main` would suppress the skip link.
   *   • Keyed on `pathname` alone. A hash-only change (an in-page anchor) must
   *     leave focus on the link the user clicked.
   */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])
}
