import { useRef } from 'react'

import Button from '@/components/Button'
import SectionLabel from '@/components/SectionLabel'
import { useHome, useServices } from '@/i18n/hooks'
import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * WHY AFGHAN FUTIAN
 * ============================================================================
 * Four statements about approach. Every one of them is a claim about *method*,
 * never about performance — because performance claims need evidence, and this
 * site does not publish numbers it cannot show the source of. The section says
 * so out loud at the end rather than hoping nobody asks.
 *
 * Composition: each row is a twelve-column grid — a marker and index in column
 * one, the statement across the middle, the reasoning pushed to the far right
 * with a deliberate gap between them. The gap does the same job it does in the
 * Introduction: it stops four rows reading as a table.
 *
 * The ground is `surface`, one step off the canvas used by Process. It is a
 * quiet shift, but it separates the argument from the sequence above it
 * without introducing a third colour.
 */

export default function WhyAfghanFutian() {
  const { WHY_INTRO } = useHome()
  const { DIFFERENTIATORS } = useServices()

  const rootRef = useRef(null)

  const headingRef = useRef(null)
  const supportRef = useRef(null)

  useGSAP(
    () => {
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 80%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })
      // `aria: 'none'` — `aria-label` is prohibited on a <p> (role `paragraph`).
      addLineReveal(intro, supportRef.current, { position: 0.16, aria: 'none' })

      gsap.utils.toArray('.why-row').forEach((row) => {
        drawRule(row.querySelector('.why-rule'), { trigger: row, start: 'top 90%' })
        fadeRise(row.querySelectorAll('.why-cell'), {
          trigger: row,
          start: 'top 88%',
          y: 22,
          stagger: 0.07,
        })
      })
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} id="why" aria-labelledby="why-heading" className="u-section bg-surface">
      <div className="u-container">
        <SectionLabel index={WHY_INTRO.index}>{WHY_INTRO.label}</SectionLabel>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <h2
            id="why-heading"
            ref={headingRef}
            className="font-display text-display-1 max-w-[18ch] font-medium uppercase lg:col-span-7"
          >
            {WHY_INTRO.heading}
          </h2>

          <p ref={supportRef} className="u-lead lg:col-span-4 lg:col-start-9 lg:pt-3">
            {WHY_INTRO.support}
          </p>
        </div>

        <ol className="mt-16 lg:mt-24">
          {DIFFERENTIATORS.map((item) => (
            <li key={item.index} className="why-row">
              <span
                aria-hidden="true"
                className="why-rule block h-px w-full origin-left bg-line"
              />

              <div className="grid grid-cols-1 gap-4 py-8 lg:grid-cols-12 lg:gap-8 lg:py-12">
                <div className="why-cell flex items-baseline gap-4 lg:col-span-1">
                  <span aria-hidden="true" className="h-[6px] w-[6px] shrink-0 bg-accent" />
                  <span className="u-eyebrow tabular-nums">{item.index}</span>
                </div>

                <h3 className="why-cell max-w-[20ch] font-display text-display-3 font-medium uppercase lg:col-span-6">
                  {item.title}
                </h3>

                <p className="why-cell max-w-[44ch] text-[0.9375rem] leading-relaxed text-muted-strong lg:col-span-4 lg:col-start-9">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Closing note + wayfinding. The note is the honest half of the section:
            it says what is deliberately absent, rather than letting the reader
            assume the absence is an oversight. */}
        <div className="mt-12 flex flex-col gap-7 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between lg:mt-16">
          <p className="max-w-[46ch] text-[0.6875rem] uppercase leading-relaxed tracking-[0.14em] text-muted-strong">
            {WHY_INTRO.note}
          </p>

          <Button to={WHY_INTRO.link.to} variant="outline" className="shrink-0">
            {WHY_INTRO.link.label}
          </Button>
        </div>
      </div>
    </section>
  )
}
