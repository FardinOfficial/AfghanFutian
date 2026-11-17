import { useRef } from 'react'

import SectionLabel from '@/components/SectionLabel'
import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * SectionIntro — the standard opening of an inner-page section.
 *
 * Every section on the site opens the same way: a numbered label, a display
 * statement running across seven columns, and the supporting prose pushed to the
 * far right with an empty column between them. That gap is deliberate — it is
 * what stops a section reading as a two-column template.
 *
 * The homepage sections (Introduction, Capabilities, Process, Global Network)
 * predate this component and keep their bespoke compositions, because each of
 * them pairs the intro block with a different photographic or sticky device.
 * The inner pages share this one, which is why they are consistent with each
 * other without being identical to the homepage.
 *
 * Reveals are owned here rather than by the caller: the statement and its
 * supporting prose arrive as a single gesture, which is the same choreography
 * used everywhere else.
 *
 * Accessibility: `aria: 'none'` is passed for the supporting prose, because
 * `aria-label` is prohibited on a `<p>` (role `paragraph`). Headings keep
 * SplitText's default `aria: 'auto'`, so a screen reader hears each heading once.
 */

const TONES = {
  light: {
    section: 'bg-canvas',
    label: 'light',
    lead: 'u-lead',
    body: 'text-muted-strong',
    rule: 'bg-line',
  },
  surface: {
    section: 'bg-surface',
    label: 'light',
    lead: 'u-lead',
    body: 'text-muted-strong',
    rule: 'bg-line',
  },
  dark: {
    section: 'bg-ink text-canvas',
    label: 'dark',
    lead: 'text-lead text-canvas/70',
    body: 'text-canvas/60',
    rule: 'bg-line-invert',
  },
}

export default function SectionIntro({
  id,
  index,
  label,
  heading,
  support,
  body,
  tone = 'light',
  rule = false,
  headingClassName = 'max-w-[20ch]',
  children,
}) {
  const rootRef = useRef(null)
  const labelRef = useRef(null)
  const headingRef = useRef(null)
  const supportRef = useRef(null)
  const bodyRef = useRef(null)
  const ruleRef = useRef(null)

  const theme = TONES[tone] ?? TONES.light
  const headingId = id ? `${id}-heading` : undefined

  useGSAP(
    () => {
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 80%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })
      if (supportRef.current) {
        addLineReveal(intro, supportRef.current, { position: 0.18, aria: 'none' })
      }

      fadeRise(labelRef.current, { trigger: rootRef.current, start: 'top 78%' })
      if (bodyRef.current) {
        fadeRise(bodyRef.current, { trigger: bodyRef.current, start: 'top 88%' })
      }
      if (ruleRef.current) {
        drawRule(ruleRef.current, { trigger: ruleRef.current, start: 'top 92%' })
      }
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      id={id}
      aria-labelledby={headingId}
      className={`u-section ${theme.section}`}
    >
      <div className="u-container">
        {rule && <div ref={ruleRef} className={`mb-10 h-px w-full origin-left ${theme.rule}`} />}

        <div ref={labelRef}>
          <SectionLabel index={index} tone={theme.label}>
            {label}
          </SectionLabel>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <h2
            id={headingId}
            ref={headingRef}
            className={`font-display text-display-1 font-medium uppercase lg:col-span-7 ${headingClassName}`}
          >
            {heading}
          </h2>

          {(support || body) && (
            <div className="lg:col-span-4 lg:col-start-9 lg:pt-3">
              {support && (
                <p ref={supportRef} className={theme.lead}>
                  {support}
                </p>
              )}
              {body && (
                <p
                  ref={bodyRef}
                  className={`text-[0.9375rem] leading-relaxed ${theme.body} ${support ? 'mt-6' : ''}`}
                >
                  {body}
                </p>
              )}
            </div>
          )}
        </div>

        {children}
      </div>
    </section>
  )
}
