import { useRef } from 'react'

import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * IndexGrid — a numbered editorial index.
 *
 * The site does not use service cards: cards force equal weight and equal size,
 * which flattens whatever is inside them. An index lets each entry be a line of
 * typography sitting on its own hairline rule, and lets the rule draw in as the
 * section arrives — the small architectural gesture that carries the brand.
 *
 * Semantics: the items are a real sequence, so this is an `<ol>`. The visible
 * number is `aria-hidden`, which means a screen reader gets the sequence from
 * the list itself rather than hearing "zero one" before every title.
 *
 * Reduced motion is handled by the helpers: `drawRule` becomes a no-op and
 * `fadeRise` snaps the cells to their final state, so nothing is ever left
 * invisible.
 */

const TONES = {
  light: {
    rule: 'bg-line',
    body: 'text-muted-strong',
    meta: 'u-eyebrow',
  },
  surface: {
    rule: 'bg-line',
    body: 'text-muted-strong',
    meta: 'u-eyebrow',
  },
  dark: {
    rule: 'bg-line-invert',
    body: 'text-canvas/60',
    meta: 'u-eyebrow text-canvas-muted',
  },
}

const COLUMNS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function IndexGrid({ items = [], tone = 'light', columns = 2, className = '' }) {
  const rootRef = useRef(null)
  const theme = TONES[tone] ?? TONES.light

  useGSAP(
    () => {
      gsap.utils.toArray('.index-rule').forEach((rule, index) => {
        drawRule(rule, { trigger: rule, start: 'top 90%', delay: index * 0.07 })
      })

      fadeRise(gsap.utils.toArray('.index-cell'), {
        trigger: rootRef.current,
        start: 'top 86%',
        y: 22,
        stagger: 0.08,
      })
    },
    { scope: rootRef },
  )

  return (
    <ol
      ref={rootRef}
      className={`grid grid-cols-1 gap-x-8 gap-y-12 ${COLUMNS[columns] ?? COLUMNS[2]} ${className}`}
    >
      {items.map((item) => (
        <li key={item.index ?? item.title} className="index-cell">
          <span aria-hidden="true" className={`index-rule block h-px w-full origin-left ${theme.rule}`} />

          <div className="pt-6">
            {item.index && (
              <span aria-hidden="true" className="u-eyebrow tabular-nums">
                {item.index}
              </span>
            )}

            <h3
              className={`font-display text-display-3 font-medium uppercase ${item.index ? 'mt-5' : ''}`}
            >
              {item.title}
            </h3>

            <p className={`mt-4 max-w-[40ch] text-sm leading-relaxed ${theme.body}`}>{item.body}</p>

            {item.meta && <p className={`mt-6 ${theme.meta}`}>{item.meta}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
