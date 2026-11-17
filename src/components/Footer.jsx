import { useRef } from 'react'
import { ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'

import Logo from '@/components/Logo'
import SocialLinks from '@/components/SocialLinks'
import {
  CONTACT_DETAILS,
  FOOTER_COMPANY,
  FOOTER_SERVICES,
  LEGAL_LINKS,
} from '@/data/navigation'
import { addLineReveal } from '@/animations/textAnimations'
import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { gsap, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { useLenis } from '@/hooks/useSmoothScroll'

/**
 * Footer.
 *
 * Treated as a destination, not an afterthought: the brand statement is set at
 * display scale and revealed line by line as it enters view, then the practical
 * navigation sits beneath it. The oversized wordmark at the very bottom is the
 * site's final gesture — it rises out of the page edge as the last thing you
 * see, and doubles as a scroll cue back to the top.
 *
 * The footer carries a little padding-bottom of its own: the wordmark's SVG
 * viewBox ends a few units below its baseline, but that alone left the name
 * almost touching the bottom of the page. The padding lives on the <footer>
 * rather than on the wordmark's container so the reveal animation — which is
 * clipped by that container — keeps its exact behaviour.
 */
export default function Footer() {
  const rootRef = useRef(null)
  const lenis = useLenis()

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      // Brand statement
      addLineReveal(gsap.timeline({
        scrollTrigger: { trigger: '.footer-statement', start: 'top 88%', once: true },
      }), rootRef.current.querySelector('.footer-statement'), { stagger: 0.09 })

      // Columns + rule
      fadeRise('.footer-col', { trigger: '.footer-columns', y: 26, stagger: 0.08 })
      drawRule('.footer-rule', { trigger: '.footer-columns' })

      // The closing wordmark rises from below the fold of the footer.
      gsap.fromTo(
        '.footer-wordmark',
        { yPercent: 32, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.footer-wordmark', start: 'top 96%', once: true },
        },
      )
    },
    { scope: rootRef },
  )

  function scrollToTop() {
    if (lenis) lenis.scrollTo(0, { duration: 1.4 })
    else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const year = new Date().getFullYear()

  return (
    <footer
      ref={rootRef}
      className="relative overflow-hidden border-t border-line-invert bg-ink pb-[clamp(1.25rem,3vh,2rem)] text-canvas"
    >
      <div className="u-container pt-[clamp(4rem,9vh,7rem)]">
        {/* Brand statement */}
        <h2 className="footer-statement font-display text-display-2 max-w-[22ch] font-medium uppercase">
          Connecting Markets.
          <br />
          Moving the World.
        </h2>

        <div className="footer-rule mt-[clamp(3rem,6vh,4.5rem)] h-px w-full origin-left bg-line-invert" />

        {/* Columns. On phones the two short link lists sit side by side rather
            than stacking into a very tall single column, while the brand block
            and the contact block take the full width. Two even columns take
            over at sm, and twelve at lg. */}
        <div className="footer-columns grid grid-cols-2 gap-x-6 gap-y-10 py-[clamp(2.5rem,5vh,4rem)] sm:gap-x-8 lg:grid-cols-12">
          <div className="footer-col col-span-2 sm:col-span-1 lg:col-span-5 lg:pr-12">
            <Logo onDark />
            <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-canvas/60">
              Afghan Futian is an international sourcing, trading and supply chain company. We
              connect sourcing operations in China with buyers and business opportunities worldwide.
            </p>
          </div>

          <nav aria-label="Services" className="footer-col lg:col-span-2">
            <h3 className="u-eyebrow text-canvas-muted">Services</h3>
            <ul className="mt-5 space-y-3">
              {FOOTER_SERVICES.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    data-cursor
                    className="u-link text-sm text-canvas/75 hover:text-canvas"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company" className="footer-col lg:col-span-2">
            <h3 className="u-eyebrow text-canvas-muted">Company</h3>
            <ul className="mt-5 space-y-3">
              {FOOTER_COMPANY.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    data-cursor
                    className="u-link text-sm text-canvas/75 hover:text-canvas"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-col col-span-2 sm:col-span-1 lg:col-span-3">
            <h3 className="u-eyebrow text-canvas-muted">Contact</h3>
            <ul className="mt-5 space-y-3 text-sm text-canvas/75">
              <li>
                <a
                  href={CONTACT_DETAILS.emailHref}
                  data-cursor
                  className="u-link hover:text-canvas"
                >
                  {CONTACT_DETAILS.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_DETAILS.phoneHref}
                  data-cursor
                  className="u-link hover:text-canvas"
                >
                  {CONTACT_DETAILS.phone}
                </a>
              </li>
              <li className="text-canvas-muted">
                {CONTACT_DETAILS.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </li>
            </ul>

            <SocialLinks tone="dark" className="mt-7" />
          </div>
        </div>

        {/* Legal bar */}
        <div className="flex flex-col gap-4 border-t border-line-invert py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-canvas-muted">
              © {year} Afghan Futian. All rights reserved.
            </p>

            <ul className="flex items-center gap-6">
              {LEGAL_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    data-cursor
                    className="u-link text-[0.6875rem] uppercase tracking-[0.14em] text-canvas/70 hover:text-canvas"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-6">
            <p className="hidden text-[0.6875rem] uppercase tracking-[0.14em] text-canvas-muted sm:block">
              Contact details are placeholders
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              data-cursor
              data-cursor-label="Top"
              className="group/up inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-canvas/70 transition-colors duration-500 hover:text-accent"
            >
              Back to top
              <ArrowUp
                size={13}
                strokeWidth={1.6}
                className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/up:-translate-y-1"
              />
            </button>
          </div>
        </div>
      </div>

      {/*
        Closing wordmark.

        Rendered as SVG text rather than HTML text, and deliberately so: it is
        pure decoration (the brand name already appears twice above it), it is
        `aria-hidden`, and as vector artwork it can sit at 9% opacity as a true
        watermark. `textLength` pins it exactly edge-to-edge at every viewport
        width without distorting the letterforms.
      */}
      <div aria-hidden="true" className="u-container select-none overflow-hidden">
        <svg
          viewBox="0 0 1216 118"
          className="footer-wordmark block w-full font-display"
          role="presentation"
          focusable="false"
        >
          <text
            x="0"
            y="112"
            textLength="1216"
            lengthAdjust="spacing"
            fontSize="150"
            fontWeight="500"
            fill="currentColor"
            className="text-canvas/[0.09]"
          >
            AFGHAN FUTIAN
          </text>
        </svg>
      </div>
    </footer>
  )
}
