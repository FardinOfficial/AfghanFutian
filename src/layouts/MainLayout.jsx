import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import ErrorBoundary from '@/components/ErrorBoundary'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import Preloader from '@/components/Preloader'
import ScrollProgress from '@/components/ScrollProgress'
import ClosingCta from '@/sections/ClosingCta'
import { ROUTES } from '@/data/navigation'
import { SmoothScrollProvider, useScrollReset } from '@/hooks/useSmoothScroll'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
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

  const [showPreloader, setShowPreloader] = useState(
    () => !prefersReducedMotion() && !isIntroComplete(),
  )

  useDocumentMeta(pathname)

  // The scheduling routes are focused transactions: the global closing enquiry
  // block would push the booking card below the fold, so it is suppressed there
  // while the navbar and footer remain untouched.
  const showClosingCta =
    ![ROUTES.contact, ROUTES.privacy, ROUTES.terms].includes(pathname) &&
    !pathname.startsWith(ROUTES.schedule)

  return (
    <SmoothScrollProvider>
      <ScrollManager />

      {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}

      <Navbar />

      <main id="main" tabIndex={-1} className="relative outline-none">
        {/* Page-scoped boundary: if a section throws, the navbar, footer and
            smooth scroll survive. Keying it on the pathname remounts it — with
            fresh state — on every navigation, so leaving a broken page always
            recovers. See ErrorBoundary. */}
        <ErrorBoundary key={pathname}>
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
  const { pathname, hash } = useLocation()
  useScrollReset(pathname, hash)
  return null
}
