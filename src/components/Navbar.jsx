import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import Button from '@/components/Button'
import Logo from '@/components/Logo'
import { NAVBAR_LINKS, PRIMARY_NAV, ROUTES, CONTACT_DETAILS } from '@/data/navigation'
import { EASE, gsap, useGSAP } from '@/lib/gsap'
import { onIntroComplete } from '@/lib/intro'
import { prefersReducedMotion } from '@/lib/motion'
import { useLenis } from '@/hooks/useSmoothScroll'
import { useNavSentinel } from '@/hooks/useNavSentinel'

/**
 * Navbar.
 *
 * Two visual states, driven by a sentinel rather than a scroll offset:
 *
 *   'over'  — transparent, light type, sitting on top of a dark hero.
 *   'solid' — canvas ground, ink type, hairline rule, once the hero has gone.
 *
 * The sentinel approach (`[data-nav-sentinel]`, placed at the foot of each
 * page's hero) is used instead of a `scrollY > 80` check because it stays
 * correct no matter how tall the hero is on a given screen. A hard-coded offset
 * always breaks on at least one breakpoint.
 *
 * If a page ships no sentinel, the navbar simply defaults to 'solid'.
 */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  const headerRef = useRef(null)
  const overlayRef = useRef(null)
  const toggleRef = useRef(null)
  const firstLinkRef = useRef(null)

  const { pathname } = useLocation()
  const lenis = useLenis()

  /** True once the page's hero has scrolled up behind the bar. */
  const solid = useNavSentinel()

  /* ---- Entrance, after the preloader hands over ------------------------- */
  useEffect(() => onIntroComplete(() => setIntroDone(true)), [])

  /* ---- Always dismiss the overlay when the route changes ---------------- */
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useGSAP(
    () => {
      if (prefersReducedMotion() || !introDone) return
      gsap.fromTo(
        headerRef.current,
        { yPercent: -100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1, ease: EASE.editorial, delay: 0.1 },
      )
    },
    { dependencies: [introDone], scope: headerRef },
  )

  /* ---- Scroll lock while the overlay is open ---------------------------- */
  useEffect(() => {
    if (!menuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lenis?.stop()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)

      // Minimal focus trap: the overlay is a full-screen modal, so Tab must
      // not escape back into the page behind it.
      if (event.key !== 'Tab') return
      const focusables = overlayRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables?.length) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      lenis?.start()
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, lenis])

  /* ---- Overlay choreography -------------------------------------------- */
  useGSAP(
    () => {
      if (!menuOpen || !overlayRef.current) return

      if (prefersReducedMotion()) {
        gsap.set(overlayRef.current, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 })
        gsap.set('.menu-line-inner, .menu-aside', { opacity: 1, yPercent: 0 })
        return
      }

      const tl = gsap.timeline()
      tl.set(overlayRef.current, { clipPath: 'inset(0% 0% 100% 0%)', opacity: 1 })
        .to(overlayRef.current, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.85,
          ease: EASE.architectural,
        })
        .fromTo(
          '.menu-line-inner',
          { yPercent: 115 },
          { yPercent: 0, duration: 0.95, ease: EASE.reveal, stagger: 0.055 },
          '-=0.45',
        )
        .fromTo(
          '.menu-aside',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7, ease: EASE.editorial, stagger: 0.07 },
          '-=0.6',
        )

      return () => tl.kill()
    },
    { dependencies: [menuOpen], scope: overlayRef },
  )

  /* ---- Focus handoff ---------------------------------------------------- */
  useEffect(() => {
    if (!menuOpen) return undefined
    const id = window.setTimeout(() => firstLinkRef.current?.focus(), 320)
    return () => window.clearTimeout(id)
  }, [menuOpen])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    toggleRef.current?.focus()
  }, [])

  const overHero = !solid && !menuOpen

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-ink focus:px-5 focus:py-3 focus:font-sans focus:text-xs focus:uppercase focus:tracking-[0.16em] focus:text-canvas"
      >
        Skip to content
      </a>

      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-[80] transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          overHero
            ? 'border-b border-transparent bg-transparent text-canvas'
            : 'border-b border-line bg-canvas/85 text-ink backdrop-blur-[14px]'
        }`}
      >
        <div className="u-container flex h-[72px] items-center justify-between gap-8 lg:h-[84px]">
          <Link
            to={ROUTES.home}
            aria-label="Afghan Futian — home"
            data-cursor
            className="shrink-0"
            onClick={() => menuOpen && closeMenu()}
          >
            {/* The mark swaps tone with the bar: light over the hero's dark
                photograph, dark once the bar goes solid. */}
            <Logo onDark={overHero} />
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {NAVBAR_LINKS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    data-cursor
                    className={({ isActive }) =>
                      `u-link font-sans text-[0.8125rem] tracking-[0.01em] transition-opacity duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-65 hover:opacity-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {/* Hidden via a wrapper, not on the Button itself.
                `Button`'s base classes always include `inline-flex`, and
                Tailwind emits `.hidden` before `.inline-flex`, so
                `className="hidden lg:inline-flex"` silently loses and the CTA
                stays visible on phones. Hiding the wrapper sidesteps the
                specificity tie entirely. */}
            <div className="hidden lg:block">
              <Button to={ROUTES.contact} variant={overHero ? 'ghost' : 'solid'}>
                Start a Conversation
              </Button>
            </div>

            {/* Mobile trigger */}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              data-cursor
              className={`flex h-11 w-11 items-center justify-center border transition-colors duration-500 lg:hidden ${
                overHero ? 'border-line-invert text-canvas' : 'border-line text-ink'
              }`}
            >
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet overlay */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-[75] flex flex-col bg-ink text-canvas lg:hidden"
        >
          <div className="u-container flex h-[72px] shrink-0 items-center justify-between">
            <Logo onDark />
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center border border-line-invert text-canvas"
            >
              <X size={17} strokeWidth={1.5} />
            </button>
          </div>

          <nav
            aria-label="Mobile"
            className="u-container flex flex-1 flex-col justify-center overflow-y-auto py-8"
          >
            <ul>
              {PRIMARY_NAV.map((item, index) => (
                <li key={item.to} className="line-mask border-b border-line-invert">
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    to={item.to}
                    onClick={closeMenu}
                    className="menu-line-inner line-inner flex items-baseline gap-4 py-4"
                  >
                    <span className="u-eyebrow w-6 shrink-0 text-canvas-muted">{item.index}</span>
                    <span className="font-display text-display-3 font-medium uppercase">
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="u-container shrink-0 border-t border-line-invert py-6">
            <div className="menu-aside grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="u-eyebrow text-canvas-muted">Email</p>
                <a href={CONTACT_DETAILS.emailHref} className="mt-2 block text-sm text-canvas/85">
                  {CONTACT_DETAILS.email}
                </a>
              </div>
              <div>
                <p className="u-eyebrow text-canvas-muted">Telephone</p>
                <a href={CONTACT_DETAILS.phoneHref} className="mt-2 block text-sm text-canvas/85">
                  {CONTACT_DETAILS.phone}
                </a>
              </div>
            </div>
            <p className="menu-aside mt-5 text-[0.6875rem] leading-relaxed text-canvas-muted">
              Contact details are placeholders pending confirmation.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
