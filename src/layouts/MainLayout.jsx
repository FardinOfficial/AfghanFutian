import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import ErrorBoundary from '@/components/ErrorBoundary'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import Preloader from '@/components/Preloader'
import ScrollProgress from '@/components/ScrollProgress'
import ClosingCta from '@/sections/ClosingCta'
import { ROUTES } from '@/data/navigation'
import { useLocale } from '@/i18n/hooks'
import { setLocaleTransitionHandler } from '@/i18n/transition'
import { SmoothScrollProvider, useScrollReset } from '@/hooks/useSmoothScroll'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { ScrollTrigger } from '@/lib/gsap'
import { isIntroComplete } from '@/lib/intro'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * MainLayout.
 *
 * Owns everything that persists across route changes: the smooth-scroll
 * provider, the preloader, the navbar, the closing call to action, the footer
 * and the scroll progress bar.
 *
 * The preloader is rendered only on the very first load of the session. Once
 * the user navigates client-side there is nothing new to wait for, and replaying
 * the curtain on every route change is the fastest way to make a site feel slow.
 *
 * The closing CTA lives here rather than on the homepage because every page
 * should end with the same ask — except on contact, the legal documents and the
 * scheduling routes. Those pages are transactions or reference material, where
 * an enquiry pitch would compete with the task. It sits *inside* `<main>`, so it
 * stays within the page's main landmark instead of floating between two
 * landmarks.
 */
export default function MainLayout() {
  const { pathname } = useLocation()
  const { contentPath, locale } = useLocale()

  const [showPreloader, setShowPreloader] = useState(
    () => !prefersReducedMotion() && !isIntroComplete(),
  )
  /** Remounting with a fresh key replays the original preloader timeline. */
  const [preloaderKey, setPreloaderKey] = useState(0)
  /** Resolves once the new locale's text has rendered and its fonts are ready. */
  const [fontGate, setFontGate] = useState(null)
  const resolveGateRef = useRef(null)
  /** Resolves only when the curtain has fully lifted (the switcher waits on it). */
  const resolveHandoffRef = useRef(null)

  useDocumentMeta(pathname)

  /**
   * Reuse the opening curtain for language changes. The order matters: cover
   * the viewport first, then apply the language/route/direction behind it, then
   * let the preloader finish only once the translated type has settled. No new
   * loading animation and no full page reload are involved.
   */
  useEffect(() => {
    setLocaleTransitionHandler(async (apply) => {
      if (prefersReducedMotion()) {
        apply()
        return
      }

      const gate = new Promise((resolve) => {
        resolveGateRef.current = resolve
      })
      const handoff = new Promise((resolve) => {
        resolveHandoffRef.current = resolve
      })
      setFontGate(gate)
      setPreloaderKey((key) => key + 1)
      setShowPreloader(true)

      // Two frames guarantees the curtain has painted before any text or
      // document direction changes, so no English or LTR layout can flash.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      apply()

      // Give React a frame to render the translated copy, then wait for the
      // fonts that copy needs. The preloader holds the curtain until both its
      // own font wait and this gate have resolved.
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await document.fonts?.ready
      resolveGateRef.current?.()
      // The switcher stays disabled until the curtain is gone, so a second
      // click cannot stack a new preloader over a half-lifted one. The timeout
      // is only a safety net — the curtain's own ceiling is much shorter — so
      // a stalled animation can never lock the control forever.
      await Promise.race([
        handoff,
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ])
    })

    return () => setLocaleTransitionHandler(null)
  }, [])

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
    resolveGateRef.current?.()
    resolveGateRef.current = null
    resolveHandoffRef.current?.()
    resolveHandoffRef.current = null
  }, [])

  // Translated copy is usually a different length from the English source,
  // which changes section heights. Refresh the single ScrollTrigger registry
  // after the locale swap and again once the local webfonts have settled, so
  // pinned sections and scrubbed animations keep their correct end positions.
  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh()
    }
    const frame = requestAnimationFrame(refresh)
    document.fonts?.ready.then(refresh)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [locale])

  // The scheduling routes are focused transactions: the global closing enquiry
  // block would push the booking card below the fold, so it is suppressed there
  // while the navbar and footer remain untouched.
  const showClosingCta =
    ![ROUTES.contact, ROUTES.privacy, ROUTES.terms].includes(contentPath) &&
    !contentPath.startsWith(ROUTES.schedule)

  return (
    <SmoothScrollProvider>
      <ScrollManager />

      {showPreloader && (
        <Preloader key={preloaderKey} ready={fontGate} onComplete={handlePreloaderComplete} />
      )}

      <Navbar />

      <main id="main" tabIndex={-1} className="relative outline-none">
        {/* Page-scoped boundary: if a section throws, the navbar, footer and
            smooth scroll survive. Keying it on the pathname remounts it — with
            fresh state — on every navigation, so leaving a broken page always
            recovers. See ErrorBoundary. */}
        {/* Keyed on the page path without its locale prefix so switching
            language keeps form state and component instances intact. */}
        <ErrorBoundary key={contentPath}>
          <Outlet />
          {showClosingCta && <ClosingCta />}
        </ErrorBoundary>
      </main>

      <Footer />
      <ScrollProgress />
    </SmoothScrollProvider>
  )
}

/**
 * Isolated so that a route change only re-renders this tiny component rather
 * than the whole layout tree (and with it, the navbar and footer).
 *
 * It reads the location itself rather than taking `pathname` as a prop, because
 * the scroll behaviour now depends on the hash too — and a hash-only change
 * (clicking `/#process` while already on the homepage) does not change
 * `pathname`, so a prop-based version would never see it.
 */
function ScrollManager() {
  const { hash } = useLocation()
  const { contentPath } = useLocale()
  // Locale-only URL changes must not reset scroll; the page is the same.
  useScrollReset(contentPath, hash)
  return null
}
