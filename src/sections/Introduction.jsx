import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import Media from '@/components/Media'
import SectionLabel from '@/components/SectionLabel'
import { INTRODUCTION } from '@/data/home'
import { MEDIA } from '@/data/media'
import { drawRule, fadeRise, imageReveal, parallax } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * INTRODUCTION
 * ============================================================================
 * The first editorial section after the hero, and the page's first breath of
 * calm. Composition rules:
 *
 *  • Asymmetry — the statement runs across seven columns, its supporting prose
 *    is pushed to the far right with an empty column between them. The gap is
 *    the point; it stops the section reading as a two-column template.
 *  • Layered depth — two photographs at different scales and different parallax
 *    rates, deliberately misaligned vertically so the eye travels diagonally.
 *  • Restraint — one accent element in the whole section (the anchor markers).
 *
 * Three-layer image construction
 * ----------------------------------------------------------------------------
 * Each photograph is three nested elements, and that is deliberate:
 *
 *    frame    → holds the clip-path reveal (overflow hidden)
 *    parallax → carries the scroll-scrubbed yPercent
 *    scale    → carries the one-shot scale settle
 *
 * Keeping the three transforms on three elements means no two GSAP tweens ever
 * write to the same transform on the same node. Putting clip, y and scale on a
 * single element works until two of them run at once, and then the transforms
 * start fighting.
 */

export default function Introduction() {
  const rootRef = useRef(null)

  const labelRef = useRef(null)
  const headingRef = useRef(null)
  const leadRef = useRef(null)
  const bodyRef = useRef(null)
  const anchorsRef = useRef(null)
  const ruleRef = useRef(null)

  const primaryFrameRef = useRef(null)
  const primaryParallaxRef = useRef(null)
  const primaryScaleRef = useRef(null)

  const secondaryFrameRef = useRef(null)
  const secondaryParallaxRef = useRef(null)
  const secondaryScaleRef = useRef(null)

  useGSAP(
    () => {
      // The statement and its supporting lead arrive as one gesture.
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 80%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })
      // `aria: 'none'` — SplitText's default `aria: 'auto'` would put an
      // `aria-label` on this <p>, where it is prohibited (role `paragraph`).
      addLineReveal(intro, leadRef.current, { position: 0.18, aria: 'none' })

      fadeRise(labelRef.current, { trigger: rootRef.current, start: 'top 78%' })
      fadeRise(bodyRef.current, { trigger: bodyRef.current, start: 'top 88%' })

      drawRule(ruleRef.current, { trigger: ruleRef.current, start: 'top 92%' })

      // Wayfinding anchors, staggered so they read left-to-right.
      const anchors = gsap.utils.toArray('.intro-anchor')
      fadeRise(anchors, { trigger: anchorsRef.current, start: 'top 90%', y: 18, stagger: 0.07 })

      // Photographs: clip open, settle from oversized, then drift on scroll.
      imageReveal(primaryFrameRef.current, primaryScaleRef.current)
      parallax(primaryParallaxRef.current, { distance: 10 })

      imageReveal(secondaryFrameRef.current, secondaryScaleRef.current, { start: 'top 88%' })
      parallax(secondaryParallaxRef.current, { distance: 16 })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      id="introduction"
      aria-labelledby="introduction-heading"
      className="u-section bg-canvas"
    >
      <div className="u-container">
        <div ref={labelRef}>
          <SectionLabel index={INTRODUCTION.index}>{INTRODUCTION.label}</SectionLabel>
        </div>

        {/* Statement — seven columns, nothing centred. */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <h2
            id="introduction-heading"
            ref={headingRef}
            className="font-display text-display-1 max-w-[20ch] font-medium uppercase lg:col-span-7"
          >
            {INTRODUCTION.heading}
          </h2>

          <div className="lg:col-span-4 lg:col-start-9 lg:pt-2">
            <p ref={leadRef} className="u-lead">
              {INTRODUCTION.lead}
            </p>
            <p ref={bodyRef} className="mt-6 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted-strong">
              {INTRODUCTION.body}
            </p>
          </div>
        </div>

        {/* Photographic composition — intentionally off-grid. */}
        <div className="mt-16 grid grid-cols-1 gap-10 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          <figure className="lg:col-span-7">
            <div ref={primaryFrameRef} className="u-frame aspect-[4/3] will-change-[clip-path]">
              <div
                ref={primaryParallaxRef}
                className="absolute inset-x-0 -bottom-[10%] -top-[10%] will-change-transform"
              >
                <div ref={primaryScaleRef} className="h-full w-full">
                  <Media
                    src={MEDIA.introductionPrimary}
                    sizes="(min-width: 1024px) 56vw, 100vw"
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>
          </figure>

          <figure className="lg:col-span-4 lg:col-start-9 lg:pt-28">
            {/* Offset and narrowed below lg. A full-width 3:4 frame turns into a
                ~1200px-tall slab on a tablet, which reads as a mistake rather
                than a composition. Capping the width keeps the diagonal
                asymmetry the desktop layout is built around. */}
            <div className="ml-auto w-[68%] max-w-[20rem] lg:ml-0 lg:w-full lg:max-w-none">
              <div ref={secondaryFrameRef} className="u-frame aspect-[3/4] will-change-[clip-path]">
                <div
                  ref={secondaryParallaxRef}
                  className="absolute inset-x-0 -bottom-[10%] -top-[10%] will-change-transform"
                >
                  <div ref={secondaryScaleRef} className="h-full w-full">
                    <Media
                      src={MEDIA.introductionSecondary}
                      sizes="(min-width: 1024px) 32vw, 68vw"
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </figure>

          {/* One honest note for the whole composition, set as a footnote. */}
          <figcaption className="text-[0.6875rem] uppercase leading-relaxed tracking-[0.14em] text-muted-strong lg:col-span-5 lg:col-start-1 lg:mt-2">
            {INTRODUCTION.mediaNote}
          </figcaption>
        </div>

        {/* Wayfinding — the three service pages, as an editorial index. */}
        <div className="mt-20 lg:mt-28">
          <div ref={ruleRef} className="h-px w-full origin-left bg-line" />
          <ul ref={anchorsRef} className="grid grid-cols-1 sm:grid-cols-3">
            {INTRODUCTION.anchors.map((anchor) => (
              <li
                key={anchor.label}
                className="border-b border-line sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
              >
                <Link
                  to={anchor.to}
                  className="intro-anchor group flex w-full items-center justify-between gap-4 py-6"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="u-eyebrow tabular-nums">{anchor.index}</span>
                    <span className="font-display text-[1.0625rem] font-medium uppercase tracking-[-0.01em]">
                      {anchor.label}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    strokeWidth={1.6}
                    className="h-4 w-4 shrink-0 text-muted-strong transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[3px] group-hover:translate-x-[3px] group-hover:text-ink"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
