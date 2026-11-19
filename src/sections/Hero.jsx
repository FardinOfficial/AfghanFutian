import { useEffect, useRef, useState } from 'react'

import Button from '@/components/Button'
import Media from '@/components/Media'
import { MEDIA } from '@/data/media'
import { ROUTES } from '@/data/navigation'
import { buildHeroIntro, buildHeroParallax } from '@/animations/heroAnimations'
import { gsap, useGSAP } from '@/lib/gsap'
import { isIntroComplete, onIntroComplete } from '@/lib/intro'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * CINEMATIC HERO
 * ============================================================================
 * The homepage's opening shot. Composition rules:
 *
 *  • Asymmetry — the headline occupies the left nine columns; the right side is
 *    given to the photograph and a small meta rail. Nothing is centred.
 *  • Layered depth — an oversized image plane sits behind two directional
 *    scrims, so the type never fights the photograph for contrast.
 *  • Architectural detail — hairline rules and a single accent square carry the
 *    brand without a single decorative flourish.
 *
 * The section carries `data-nav-sentinel`, which is how the navbar knows to be
 * transparent here and solid everywhere after.
 */

/** Small factual meta rail — no invented figures. */
const HERO_META = [
  { label: 'Sourcing origin', value: 'China' },
  { label: 'Coordination', value: 'Supply chain' },
  { label: 'Reach', value: 'Worldwide' },
]

export default function Hero() {
  const rootRef = useRef(null)
  const imageWrapRef = useRef(null)
  const imageRef = useRef(null)
  const contentRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headlineRef = useRef(null)
  const descriptionRef = useRef(null)
  const actionsRef = useRef(null)
  const scrollCueRef = useRef(null)
  const cueDotRef = useRef(null)

  const introTl = useRef(null)
  const [introDone, setIntroDone] = useState(() => isIntroComplete())

  /* Play the entrance the moment the preloader hands over. */
  useEffect(() => onIntroComplete(() => setIntroDone(true)), [])

  useGSAP(
    () => {
      const meta = gsap.utils.toArray('.hero-meta')

      // Built paused: the preloader decides when this plays.
      introTl.current = buildHeroIntro({
        root: rootRef.current,
        imageWrap: imageWrapRef.current,
        image: imageRef.current,
        eyebrow: eyebrowRef.current,
        headline: headlineRef.current,
        description: descriptionRef.current,
        actions: actionsRef.current,
        meta,
        scrollCue: scrollCueRef.current,
      })

      if (!introDone) introTl.current.pause()

      buildHeroParallax({
        root: rootRef.current,
        image: imageRef.current,
        content: contentRef.current,
      })

      // Scroll cue: a small accent block travelling down a hairline.
      let cueTween
      if (!prefersReducedMotion() && cueDotRef.current) {
        cueTween = gsap.fromTo(
          cueDotRef.current,
          { yPercent: -100 },
          {
            yPercent: 340,
            duration: 1.9,
            ease: 'power1.inOut',
            repeat: -1,
            repeatDelay: 0.35,
          },
        )
      }

      return () => cueTween?.kill()
    },
    { scope: rootRef },
  )

  useEffect(() => {
    if (introDone) introTl.current?.play()
  }, [introDone])

  return (
    <section
      ref={rootRef}
      data-nav-sentinel
      aria-labelledby="hero-heading"
      className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-canvas"
    >
      {/* ---- Photograph plane -------------------------------------------- */}
      <div ref={imageWrapRef} className="absolute inset-0 will-change-[clip-path]">
        {/* Oversized so parallax never exposes an edge. */}
        <div ref={imageRef} className="absolute inset-[-8%] will-change-transform">
          <Media
            src={MEDIA.heroPrimary}
            alt="Placeholder: a container ship being loaded by gantry cranes at an industrial port at dusk"
            sizes="100vw"
            priority
            className="h-full w-full"
            imgClassName="object-center"
          />
        </div>
      </div>

      {/* ---- Directional scrims ------------------------------------------ */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(20,20,20,0.95)_0%,rgba(20,20,20,0.82)_34%,rgba(20,20,20,0.30)_66%,rgba(20,20,20,0.62)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.92)_0%,rgba(20,20,20,0.25)_34%,transparent_60%)]"
      />
      {/* Fine grain keeps the large dark field from banding. */}
      <div aria-hidden="true" className="grain-layer opacity-[0.05] mix-blend-soft-light" />

      {/* ---- Content ------------------------------------------------------ */}
      <div
        ref={contentRef}
        className="u-container relative z-10 flex min-h-[100svh] flex-col justify-between pb-8 pt-[96px] lg:pb-10 lg:pt-[116px]"
      >
        {/* Top rail */}
        <div className="flex items-start gap-8">
          <div ref={eyebrowRef} className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 bg-accent" />
            <p className="u-eyebrow text-canvas/75">International Sourcing &amp; Logistics</p>
          </div>
        </div>

        {/* Statement */}
        <div className="py-12 lg:py-16">
          <h1
            id="hero-heading"
            ref={headlineRef}
            className="max-w-[16ch] font-display text-hero font-medium uppercase"
          >
            <span className="line-mask">
              <span className="line-inner">The World Moves.</span>
            </span>
            <span className="line-mask">
              <span className="line-inner">
                We Connect It<span className="text-accent">.</span>
              </span>
            </span>
          </h1>

          <div className="mt-10 grid grid-cols-1 gap-9 lg:mt-14 lg:grid-cols-12 lg:items-end lg:gap-6">
            <p
              ref={descriptionRef}
              className="u-lead max-w-[44ch] text-canvas/70 lg:col-span-5"
            >
              Global sourcing and supply chain solutions, connecting China with opportunities
              worldwide.
            </p>

            <div
              ref={actionsRef}
              className="flex flex-wrap items-center gap-3 lg:col-span-6 lg:col-start-7 lg:justify-end"
            >
              <Button to={ROUTES.sourcing} variant="accent" size="lg">
                Explore Our Services
              </Button>
              <Button to={ROUTES.contact} variant="ghost" size="lg">
                Start a Conversation
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom rail */}
        <div>
          <div className="hero-rule h-px w-full bg-line-invert" />

          <div className="flex items-end justify-between gap-8 pt-6">
            <div ref={scrollCueRef} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="relative block h-11 w-px overflow-hidden bg-canvas/25"
              >
                <span ref={cueDotRef} className="absolute inset-x-0 top-0 h-3 bg-accent" />
              </span>
              <span className="u-eyebrow text-canvas-muted">Scroll</span>
            </div>

            <dl className="hidden items-end gap-8 sm:flex lg:gap-14">
              {HERO_META.map((item) => (
                <div key={item.label} className="hero-meta">
                  <dt className="u-eyebrow text-canvas-muted">{item.label}</dt>
                  <dd className="mt-2 font-display text-[0.9375rem] tracking-[-0.01em] text-canvas/85">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
