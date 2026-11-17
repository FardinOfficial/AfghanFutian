import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import Media from '@/components/Media'
import SectionLabel from '@/components/SectionLabel'
import { CAPABILITIES_INTRO } from '@/data/home'
import { CAPABILITIES } from '@/data/services'
import { drawRule, fadeRise, imageReveal } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'

/**
 * CORE CAPABILITIES
 * ============================================================================
 * Four capabilities, presented as an editorial index rather than four service
 * cards. The reasoning: cards force equal weight and equal size, which flattens
 * the content. An index lets each capability be a line of typography, and lets
 * the photography change on its own terms.
 *
 * Two layouts, one markup
 * ----------------------------------------------------------------------------
 *  Desktop — the index occupies seven columns, and a sticky preview panel holds
 *            the fourth column block. The panel cross-fades between the four
 *            photographs as the index is scrolled or hovered.
 *  Mobile  — no sticky panel (it would fight the scroll and waste bytes), so
 *            each row carries its own photograph, revealed on entry.
 *
 * The breakpoint split is handled by `gsap.matchMedia()` rather than by CSS
 * alone, because the two layouts need genuinely different animation work. A
 * hidden element still gets a ScrollTrigger otherwise, and those triggers
 * compute nonsense start/end positions from a zero-height box.
 *
 * The panel is `aria-hidden`: it restates information already present in the
 * index, so announcing it would just be repetition for screen-reader users.
 */

export default function Capabilities() {
  const rootRef = useRef(null)

  const headingRef = useRef(null)
  const supportRef = useRef(null)
  const listRef = useRef(null)
  const panelFrameRef = useRef(null)

  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      /* ---- Shared: typography, rules and rows --------------------------- */
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 80%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })
      // `aria: 'none'` — `aria-label` is prohibited on a <p> (role `paragraph`).
      addLineReveal(intro, supportRef.current, { position: 0.16, aria: 'none' })

      gsap.utils.toArray('.cap-rule').forEach((rule, index) => {
        drawRule(rule, { trigger: rule, start: 'top 90%', delay: Math.min(index, 3) * 0.03 })
      })

      gsap.utils.toArray('.cap-row').forEach((row) => {
        fadeRise(row.querySelectorAll('.cap-cell'), {
          trigger: row,
          start: 'top 88%',
          y: 22,
          stagger: 0.07,
        })
      })

      /* ---- Breakpoint-specific work ------------------------------------- */
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        imageReveal(panelFrameRef.current, null, { start: 'top 85%' })

        // As each row crosses the middle of the viewport it becomes "active",
        // which drives the sticky panel. `isActive` guards against the leave
        // event firing a state update on the way out.
        const triggers = gsap.utils.toArray('.cap-row').map((row, index) =>
          ScrollTrigger.create({
            trigger: row,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: (self) => {
              if (self.isActive) setActive(index)
            },
          }),
        )

        return () => triggers.forEach((trigger) => trigger.kill())
      })

      mm.add('(max-width: 1023px)', () => {
        gsap.utils.toArray('.cap-mobile-frame').forEach((frame) => {
          imageReveal(frame, frame.querySelector('.cap-mobile-layer'), { start: 'top 88%' })
        })
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  const activeCapability = CAPABILITIES[active]

  return (
    <section
      ref={rootRef}
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="u-section bg-canvas"
    >
      <div className="u-container">
        <SectionLabel index={CAPABILITIES_INTRO.index}>{CAPABILITIES_INTRO.label}</SectionLabel>

        {/* Header — statement left, supporting argument right, one column apart. */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <h2
            id="capabilities-heading"
            ref={headingRef}
            className="font-display text-display-1 max-w-[18ch] font-medium uppercase lg:col-span-7"
          >
            {CAPABILITIES_INTRO.heading}
          </h2>

          <p ref={supportRef} className="u-lead lg:col-span-4 lg:col-start-9 lg:pt-3">
            {CAPABILITIES_INTRO.support}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          {/* ---- Index ---------------------------------------------------- */}
          <ol ref={listRef} className="lg:col-span-7">
            {CAPABILITIES.map((capability, index) => (
              <li
                key={capability.id}
                className="cap-row"
                onMouseEnter={() => setActive(index)}
              >
                <span aria-hidden="true" className="cap-rule block h-px w-full origin-left bg-line" />

                <Link
                  to={capability.to}
                  onFocus={() => setActive(index)}
                  className="group grid grid-cols-12 items-start gap-4 pb-8 pt-7 lg:pb-10 lg:pt-9"
                >
                  <span className="cap-cell col-span-2 flex items-baseline gap-3 lg:col-span-1">
                    <span
                      aria-hidden="true"
                      className={`mt-[0.42em] h-[6px] w-[6px] shrink-0 transition-colors duration-500 ${
                        active === index ? 'bg-accent' : 'bg-line'
                      }`}
                    />
                    <span className="font-display text-[0.8125rem] tabular-nums tracking-[0.1em] text-muted-strong">
                      {capability.index}
                    </span>
                  </span>

                  <span className="cap-cell col-span-9 lg:col-span-7">
                    <span className="block font-display text-display-3 font-medium uppercase leading-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2">
                      {capability.title}
                    </span>
                    <span className="mt-3 block max-w-[44ch] text-sm leading-relaxed text-muted-strong">
                      {capability.summary}
                    </span>
                  </span>

                  <span className="cap-cell col-span-1 flex justify-end lg:col-span-4">
                    <ArrowUpRight
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="h-5 w-5 text-muted-strong transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink"
                    />
                  </span>

                  {/* Mobile-only photograph. Inside the link so tapping it
                      navigates, exactly like tapping the row. */}
                  <div className="col-span-12 mt-7 lg:hidden">
                    <div className="cap-mobile-frame u-frame aspect-[16/10] max-h-[58vh] will-change-[clip-path]">
                      <div className="cap-mobile-layer h-full w-full">
                        <Media
                          src={capability.media}
                          sizes="100vw"
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>

          {/* ---- Sticky preview (desktop) ---------------------------------- */}
          <div className="hidden lg:col-span-4 lg:col-start-9 lg:block">
            <div className="sticky top-32" aria-hidden="true">
              <div ref={panelFrameRef} className="u-frame aspect-[4/5] will-change-[clip-path]">
                {CAPABILITIES.map((capability, index) => (
                  <div
                    key={capability.id}
                    className="absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ opacity: active === index ? 1 : 0 }}
                  >
                    <Media
                      src={capability.media}
                      decorative
                      sizes="(min-width: 1024px) 32vw, 100vw"
                      className="h-full w-full"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="u-eyebrow">
                  {activeCapability.index} — {activeCapability.title}
                </span>
                <span className="u-eyebrow">{CAPABILITIES_INTRO.panelCaption}</span>
              </div>

              {/* Progress ticks — a quiet position indicator, no bar, no dots. */}
              <div className="mt-4 flex gap-1.5">
                {CAPABILITIES.map((capability, index) => (
                  <span
                    key={capability.id}
                    className={`h-px flex-1 transition-colors duration-500 ${
                      index <= active ? 'bg-ink' : 'bg-line'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
