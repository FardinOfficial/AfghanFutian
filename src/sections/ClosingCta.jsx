import { useRef } from 'react'

import Button from '@/components/Button'
import Media from '@/components/Media'
import { MEDIA } from '@/data/media'
import { useHome } from '@/i18n/hooks'
import { fadeRise, imageReveal, parallax } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * CLOSING CALL TO ACTION
 * ============================================================================
 * The last thing before the footer, and the deliberate bookend to the hero:
 * the site opens on a full-bleed photograph with type over it, and it closes on
 * one. The echo is the point — the two plates are the same gesture, which is
 * what makes the page feel like it has a shape rather than a length.
 *
 * It is not a copy of the hero, though. Three things separate them:
 *
 *  • Height and anchor — the hero runs a full viewport with its content spread
 *    top-to-bottom. This plate is shorter and anchors everything to the bottom,
 *    so the photograph is allowed to be empty above the type.
 *  • Argument — the hero states what the company is. This states what the
 *    reader should do, and then does something rarer: it explains how to make
 *    the enquiry land.
 *  • Restraint — no meta rail of facts. In its place, a numbered checklist,
 *    which is the only place on the site where a list is the right form.
 *
 * Three-layer image construction, as everywhere else: frame holds the
 * clip-path, the middle layer holds the scroll-scrubbed parallax, the inner
 * layer holds the one-shot scale settle. No two tweens ever write to the same
 * transform on the same node.
 *
 * The photograph is `decorative` — it is a background plane with no information
 * in it, so it is hidden from assistive technology rather than given a caption
 * nobody needs.
 */

export default function ClosingCta() {
  const { CLOSING_CTA } = useHome()

  const rootRef = useRef(null)

  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const supportRef = useRef(null)
  const actionsRef = useRef(null)
  const briefRef = useRef(null)

  const mediaFrameRef = useRef(null)
  const mediaParallaxRef = useRef(null)
  const mediaScaleRef = useRef(null)

  useGSAP(
    () => {
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 82%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })
      // `aria: 'none'` — `aria-label` is prohibited on a <p> (role `paragraph`).
      addLineReveal(intro, supportRef.current, { position: 0.16, aria: 'none' })

      fadeRise(eyebrowRef.current, { trigger: rootRef.current, start: 'top 80%', y: 14 })
      fadeRise(actionsRef.current, { trigger: actionsRef.current, start: 'top 92%', y: 20 })
      fadeRise(gsap.utils.toArray('.cta-brief'), {
        trigger: briefRef.current,
        start: 'top 92%',
        y: 18,
        stagger: 0.07,
      })

      imageReveal(mediaFrameRef.current, mediaScaleRef.current, { start: 'top 94%' })
      parallax(mediaParallaxRef.current, { distance: 12 })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      id="closing-cta"
      aria-labelledby="closing-cta-heading"
      className="relative isolate flex min-h-[78svh] flex-col justify-end overflow-hidden bg-ink text-canvas lg:min-h-[84svh]"
    >
      {/* ---- Photograph plane -------------------------------------------- */}
      <div ref={mediaFrameRef} className="absolute inset-0 will-change-[clip-path]">
        {/* Oversized so parallax never exposes an edge. */}
        <div
          ref={mediaParallaxRef}
          className="absolute inset-x-0 -bottom-[9%] -top-[9%] will-change-transform"
        >
          <div ref={mediaScaleRef} className="h-full w-full">
            <Media src={MEDIA.closingCta} decorative sizes="100vw" className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* ---- Scrims ------------------------------------------------------- */}
      {/* Weighted to the bottom-left, where the type actually sits. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.95)_0%,rgba(20,20,20,0.72)_36%,rgba(20,20,20,0.3)_72%,rgba(20,20,20,0.44)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(20,20,20,0.88)_0%,rgba(20,20,20,0.52)_46%,rgba(20,20,20,0.12)_100%)]"
      />
      <div aria-hidden="true" className="grain-layer opacity-[0.05] mix-blend-soft-light" />

      {/* ---- Content ------------------------------------------------------ */}
      <div className="u-container relative z-10 pb-14 pt-[clamp(5rem,16vh,10rem)] lg:pb-20">
        <div ref={eyebrowRef} className="flex items-center gap-3">
          <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 bg-accent-on-dark" />
          <p className="u-eyebrow text-canvas/75">{CLOSING_CTA.label}</p>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h2
              id="closing-cta-heading"
              ref={headingRef}
              className="max-w-[18ch] font-display text-display-1 font-medium uppercase"
            >
              {CLOSING_CTA.heading}
            </h2>

            <p ref={supportRef} className="mt-7 max-w-[46ch] text-lead text-canvas/70">
              {CLOSING_CTA.support}
            </p>

            <div ref={actionsRef} className="mt-10 flex flex-wrap items-center gap-3">
              <Button to={CLOSING_CTA.primary.to} variant="accent" size="lg">
                {CLOSING_CTA.primary.label}
              </Button>
              <Button to={CLOSING_CTA.schedule.to} variant="ghost" size="lg" icon={false}>
                {CLOSING_CTA.schedule.label}
              </Button>
              <Button href={CLOSING_CTA.secondary.href} variant="ghost" size="lg">
                {CLOSING_CTA.secondary.label}
              </Button>
            </div>
          </div>

          {/* The checklist. Utility, set as typography rather than as a card. */}
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-3">
            <h3 className="u-eyebrow text-canvas-muted">{CLOSING_CTA.brief.label}</h3>

            <ul ref={briefRef} className="mt-5">
              {CLOSING_CTA.brief.items.map((item, index) => (
                <li
                  key={item}
                  className="cta-brief flex items-baseline gap-4 border-t border-line-invert py-4"
                >
                  <span className="u-eyebrow tabular-nums text-canvas-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm leading-relaxed text-canvas/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
