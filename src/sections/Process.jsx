import { useRef, useState } from 'react'

import Media from '@/components/Media'
import SectionLabel from '@/components/SectionLabel'
import { PROCESS_INTRO } from '@/data/home'
import { PROCESS_STEPS } from '@/data/services'
import { drawRule, fadeRise, imageReveal } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'

/**
 * PROCESS
 * ============================================================================
 * Five stages, told as a sequence rather than a numbered list of features. The
 * section is deliberately asymmetric: the story runs down the right-hand eight
 * columns, while the left three hold a rail that stays with you.
 *
 * Two layouts, one markup
 * ----------------------------------------------------------------------------
 *  Desktop — the rail is `position: sticky`. As each step crosses the middle of
 *            the viewport it becomes the active stage, so the rail doubles as a
 *            position indicator. A hairline fill tracks scroll progress down the
 *            rail. This is *not* a pinned section: the page scrolls natively and
 *            the rail simply follows, which is the difference between wayfinding
 *            and scroll hijacking.
 *  Mobile  — the rail collapses into a vertical timeline spine with accent
 *            markers, and each step carries its own photograph.
 *
 * The desktop-only work is registered inside `gsap.matchMedia()` so that no
 * ScrollTrigger is ever created against the rail while it is `display: none`.
 *
 * The steps are `<article>` elements inside a plain `<div>`, not a `<ol>`: the
 * sequence is real, but the stage numbers are already printed in the copy, and
 * an ordered list would announce them twice.
 */

export default function Process() {
  const rootRef = useRef(null)

  const headingRef = useRef(null)
  const supportRef = useRef(null)
  const progressRef = useRef(null)

  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 80%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })
      // `aria: 'none'` — `aria-label` is prohibited on a <p> (role `paragraph`).
      addLineReveal(intro, supportRef.current, { position: 0.16, aria: 'none' })

      /* ---- Shared: rules, panels and photographs ------------------------ */
      gsap.utils.toArray('.process-step').forEach((step) => {
        drawRule(step.querySelector('.process-rule'), { trigger: step, start: 'top 88%' })
        fadeRise(step.querySelectorAll('.process-cell'), {
          trigger: step,
          start: 'top 86%',
          y: 24,
          stagger: 0.08,
        })
        imageReveal(step.querySelector('.process-frame'), step.querySelector('.process-layer'), {
          start: 'top 88%',
        })
      })

      /* ---- Breakpoint-specific work ------------------------------------- */
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        const fill = gsap.fromTo(
          progressRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: {
              trigger: '.process-steps',
              start: 'top 62%',
              end: 'bottom 72%',
              scrub: true,
            },
          },
        )

        const triggers = gsap.utils.toArray('.process-step').map((step, index) =>
          ScrollTrigger.create({
            trigger: step,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: (self) => {
              if (self.isActive) setActive(index)
            },
          }),
        )

        return () => {
          fill.scrollTrigger?.kill()
          fill.kill()
          triggers.forEach((trigger) => trigger.kill())
        }
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} id="process" aria-labelledby="process-heading" className="u-section bg-canvas">
      <div className="u-container">
        <SectionLabel index={PROCESS_INTRO.index}>{PROCESS_INTRO.label}</SectionLabel>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <h2
            id="process-heading"
            ref={headingRef}
            className="font-display text-display-1 max-w-[16ch] font-medium uppercase lg:col-span-7"
          >
            {PROCESS_INTRO.heading}
          </h2>

          <p ref={supportRef} className="u-lead lg:col-span-4 lg:col-start-9 lg:pt-3">
            {PROCESS_INTRO.support}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          {/* ---- Progress rail (desktop only) ----------------------------- */}
          <div className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-32">
              <p className="u-eyebrow">{PROCESS_INTRO.progressLabel}</p>

              <div className="relative mt-7 pl-6">
                {/* Static spine, then the ink fill drawn over it. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-3 left-[3px] top-3 w-px bg-line"
                />
                <span
                  ref={progressRef}
                  aria-hidden="true"
                  className="absolute bottom-3 left-[3px] top-3 w-px origin-top bg-ink"
                />

                <ol>
                  {PROCESS_STEPS.map((step, index) => (
                    <li key={step.id} className="relative py-2.5">
                      <span
                        aria-hidden="true"
                        className={`absolute left-[-24px] top-1/2 h-[7px] w-[7px] -translate-y-1/2 transition-colors duration-500 ${
                          active === index ? 'bg-accent' : 'bg-line'
                        }`}
                      />

                      <div className="flex items-baseline gap-3">
                        <span
                          className={`u-eyebrow tabular-nums transition-colors duration-500 ${
                            active === index ? 'text-ink' : 'text-muted-strong'
                          }`}
                        >
                          {step.index}
                        </span>
                        <span
                          className={`text-sm leading-snug transition-colors duration-500 ${
                            active === index ? 'text-ink' : 'text-muted-strong'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* ---- The steps ------------------------------------------------- */}
          <div className="process-steps lg:col-span-8 lg:col-start-5">
            {PROCESS_STEPS.map((step) => (
              <article key={step.id} className="process-step">
                <span
                  aria-hidden="true"
                  className="process-rule block h-px w-full origin-left bg-line"
                />

                <div className="grid grid-cols-1 gap-8 pb-12 pt-8 md:grid-cols-12 lg:gap-8 lg:pb-16 lg:pt-10">
                  <div className="md:col-span-7">
                    <div className="process-cell flex items-baseline gap-4">
                      <span className="u-eyebrow tabular-nums">{step.index}</span>
                      <h3 className="font-display text-display-3 font-medium uppercase">
                        {step.title}
                      </h3>
                    </div>

                    <p className="process-cell mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted-strong">
                      {step.description}
                    </p>

                    <p className="process-cell mt-6 u-eyebrow">{step.meta}</p>
                  </div>

                  <figure className="process-cell md:col-span-5">
                    <div className="process-frame u-frame aspect-[16/10] will-change-[clip-path]">
                      <div className="process-layer h-full w-full">
                        <Media
                          src={step.media}
                          sizes="(min-width: 1024px) 34vw, 100vw"
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                  </figure>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
