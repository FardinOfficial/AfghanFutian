import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import Button from '@/components/Button'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Logo from '@/components/Logo'
import SocialLinks from '@/components/SocialLinks'
import { LocaleLink, LocaleNavLink } from '@/i18n/LocaleLink'
import { useNavigation } from '@/i18n/hooks'
import { EASE, gsap, useGSAP } from '@/lib/gsap'
import { onIntroComplete } from '@/lib/intro'
import { BREAKPOINT_2XL, onMediaChange, prefersReducedMotion } from '@/lib/motion'
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
 * always breaks on one viewport or another.
 *
 * Link hover
 * ----------------------------------------------------------------------------
 * A nav link lifts to full-strength ink and draws an accent hairline beneath
 * itself; over the dark hero it lifts to the accent colour itself. That split is
 * deliberate rather than cosmetic: the accent is a bright yellow-green that
 * reaches roughly 1.05:1 against the canvas ground, so accent *text* on the
 * solid bar would be effectively invisible. The accent is therefore used as the
 * hover colour only where it is legible, and as the underline — which is a
 * graphic element, not text — everywhere. Font size, spacing and the bar's
 * dimensions are untouched.
 *
 * The mobile overlay
 * ----------------------------------------------------------------------------
 * The overlay is a full-screen panel raised *above* the header (`z-[90]` against
 * the header's `z-[80]`), and it carries its own logo and close button. It used
 * to sit below the header, which meant the header's own logo and toggle painted
 * on top of the panel's duplicates — two logos and two close controls, one of
 * them light-on-dark and one dark-on-light. Raising the panel removes the
 * overlap entirely and leaves exactly one control for each job.
 *
 * While it is open it traps focus, locks the page behind it, closes on Escape,
 * on a link, on a click in the empty space, and on the viewport reaching the
 * desktop breakpoint (where the panel is hidden by CSS and would otherwise
 * strand the scroll lock on).
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
  const { t } = useTranslation()
  const { NAVBAR_LINKS, PRIMARY_NAV, ROUTES } = useNavigation()
  const tr = useCallback((key) => t(key, { ns: 'common' }), [t])

  /** True once the page's hero has scrolled up behind the bar. */
  const solid = useNavSentinel()

  /* ---- Entrance, after the preloader hands over ------------------------- */
  useEffect(() => onIntroComplete(() => setIntroDone(true)), [])

  /* ---- Always dismiss the overlay when the route changes ---------------- */
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  /* ---- Never leave the overlay open past the breakpoint that hides it ---- */
  useEffect(() => {
    if (!menuOpen) return undefined
    return onMediaChange(BREAKPOINT_2XL, (isDesktop) => {
      if (isDesktop) setMenuOpen(false)
    })
  }, [menuOpen])

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

  /**
   * Close only when the press lands on the backdrop itself — the panel's own
   * empty space — never when it lands on a control inside it. Comparing against
   * `currentTarget` rather than checking for a closest link keeps a tap on a
   * link's padding from being treated as a backdrop tap.
   */
  const onBackdropClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget) closeMenu()
    },
    [closeMenu],
  )

  const overHero = !solid && !menuOpen

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-ink focus:px-5 focus:py-3 focus:font-sans focus:text-xs focus:uppercase focus:tracking-[0.16em] focus:text-canvas"
      >
        {tr('Skip to content')}
      </a>

      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-[80] transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          overHero
            ? 'border-b border-transparent bg-transparent text-canvas'
            : 'border-b border-line bg-canvas/85 text-ink backdrop-blur-[14px]'
        }`}
      >
        {/* Four groups on desktop — logo, links, language selector and actions —
            spaced by justify-between so the gap on either side of the selector
            is identical. `2xl` gives those groups room without shrinking any
            label; below it only the logo and the menu toggle remain. */}
        <div className="u-container flex h-[72px] items-center justify-between gap-6 2xl:h-[84px] 2xl:gap-8">
          <LocaleLink
            to={ROUTES.home}
            aria-label={t('Afghan Futian Trading Company — home', { ns: 'common' })}
            className="shrink-0"
            onClick={() => menuOpen && closeMenu()}
          >
            {/* The mark swaps tone with the bar: light over the hero's dark
                photograph, dark once the bar goes solid. */}
            <Logo onDark={overHero} />
          </LocaleLink>

          {/* Desktop navigation. Held back to `2xl`: five links, the selector
              and two calls to action need room to breathe in every language.
              See BREAKPOINT_2XL in `src/lib/motion.js`. */}
          <nav aria-label={tr('Primary')} className="hidden shrink-0 2xl:block">
            <ul className="flex items-center gap-6">
              {NAVBAR_LINKS.map((item) => (
                <li key={item.to}>
                  <LocaleNavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `u-link font-sans text-[0.8125rem] tracking-[0.01em] transition-colors duration-300 [--u-link-underline:var(--color-accent)] ${
                        overHero
                          ? isActive
                            ? 'text-canvas'
                            : 'text-canvas/75 hover:text-accent'
                          : isActive
                            ? 'text-ink'
                            : 'text-ink/70 hover:text-ink'
                      }`
                    }
                  >
                    {item.label}
                  </LocaleNavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* The selector is a peer of the links and the actions, not a child
              of either, so its two neighbouring gaps stay equal. */}
          <div className="hidden shrink-0 2xl:block">
            <LanguageSwitcher tone={overHero ? 'dark' : 'light'} />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Hidden via a wrapper, not on the Button itself.
                `Button`'s base classes always include `inline-flex`, and
                Tailwind emits `.hidden` before `.inline-flex`, so
                `className="hidden 2xl:inline-flex"` silently loses and the CTA
                stays visible on phones. Hiding the wrapper sidesteps the
                specificity tie entirely. */}
            <div className="hidden items-center gap-3 2xl:flex">
              <Button
                to={ROUTES.schedule}
                variant={overHero ? 'ghost' : 'outline'}
                icon={false}
              >
                {tr('Schedule a Meeting')}
              </Button>
              <Button to={ROUTES.contact} variant={overHero ? 'ghost' : 'solid'}>
                {tr('Start a Conversation')}
              </Button>
            </div>

            {/* Mobile trigger */}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={tr(menuOpen ? 'Close menu' : 'Open menu')}
              className={`flex h-11 w-11 items-center justify-center border transition-colors duration-500 2xl:hidden ${
                overHero ? 'border-line-invert text-canvas' : 'border-line text-ink'
              }`}
            >
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet overlay. Sits above the header so the header's logo
          and toggle cannot paint through it; see the note at the top. */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={tr('Site navigation')}
          onClick={onBackdropClick}
          className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-ink text-canvas 2xl:hidden"
        >
          <div className="u-container flex h-[72px] shrink-0 items-center justify-between">
            <Logo onDark />
            <button
              type="button"
              onClick={closeMenu}
              aria-label={tr('Close menu')}
              className="flex h-11 w-11 items-center justify-center border border-line-invert text-canvas"
            >
              <X size={17} strokeWidth={1.5} />
            </button>
          </div>

          <nav
            aria-label={tr('Mobile')}
            onClick={onBackdropClick}
            className="u-container flex min-h-0 flex-1 flex-col justify-center overflow-y-auto py-8"
          >
            <ul>
              {PRIMARY_NAV.map((item, index) => (
                <li key={item.to} className="line-mask border-b border-line-invert">
                  <LocaleLink
                    ref={index === 0 ? firstLinkRef : undefined}
                    to={item.to}
                    onClick={closeMenu}
                    className="menu-line-inner line-inner flex items-baseline gap-4 py-4"
                  >
                    <span className="u-eyebrow w-6 shrink-0 text-canvas-muted">{item.index}</span>
                    <span className="font-display text-display-3 font-medium uppercase">
                      {item.title}
                    </span>
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="u-container shrink-0 border-t border-line-invert py-6">
            <div className="menu-aside">
              <Button
                to={ROUTES.schedule}
                variant="accent"
                size="lg"
                icon={false}
                onClick={closeMenu}
                className="w-full"
              >
                {tr('Schedule a Meeting')}
              </Button>
              <div className="mt-5 flex justify-center">
                <LanguageSwitcher tone="dark" />
              </div>
            </div>

            <div className="menu-aside mt-6">
              <p className="u-eyebrow text-canvas-muted">{tr('Elsewhere')}</p>
              <SocialLinks tone="dark" className="mt-3" onNavigate={closeMenu} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
