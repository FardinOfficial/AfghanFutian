import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { useGSAP } from '@/lib/gsap'

/**
 * NextStep — the cross-link that closes a service page.
 *
 * The three service pages are consecutive stages of one requirement, so each one
 * ends by pointing at the stage that follows. Presented as a full-width block
 * rather than a button, because it is a continuation of the argument rather than
 * an action taken from it.
 *
 * The link is an absolutely-positioned overlay covering the block, and the block
 * itself is labelled by its own heading via `aria-labelledby`. That keeps the
 * whole area clickable while leaving the heading outside the anchor, where it
 * still participates in the document outline properly.
 */

export default function NextStep({ label, to, description, eyebrow = 'Next stage' }) {
  const rootRef = useRef(null)
  const ruleRef = useRef(null)
  const contentRef = useRef(null)
  const headingId = 'next-step-heading'

  useGSAP(
    () => {
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 92%' })
      fadeRise(contentRef.current, { trigger: rootRef.current, start: 'top 90%', y: 22 })
    },
    { scope: rootRef },
  )

  if (!to) return null

  return (
    <section ref={rootRef} aria-labelledby={headingId} className="u-section bg-canvas">
      <div className="u-container">
        <div ref={ruleRef} className="h-px w-full origin-left bg-line" />

        <div ref={contentRef} className="group relative py-12 lg:py-16">
          <Link
            to={to}
            data-cursor
            aria-labelledby={headingId}
            className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8">
            <p className="u-eyebrow lg:col-span-2">{eyebrow}</p>

            <div className="lg:col-span-8">
              <h2
                id={headingId}
                className="font-display text-display-2 font-medium uppercase transition-colors duration-500 group-hover:text-ink"
              >
                {label}
              </h2>
              {description && (
                <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted-strong">
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-end justify-start lg:col-span-2 lg:justify-end">
              <span className="flex h-14 w-14 items-center justify-center border border-line transition-colors duration-500 group-hover:border-ink group-hover:bg-ink">
                <ArrowUpRight
                  aria-hidden="true"
                  strokeWidth={1.4}
                  className="h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[3px] group-hover:translate-x-[3px] group-hover:text-accent"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
