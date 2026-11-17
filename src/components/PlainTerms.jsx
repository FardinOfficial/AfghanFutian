import { useRef } from 'react'

import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * PlainTerms — the "in plain terms" block.
 *
 * This component exists because of an editorial decision rather than a layout
 * one: every page that could overstate something ends with a list of the claims
 * it deliberately does not make. Pairing "what this is" with "what this is not"
 * is the house style, and it reads far better as two columns of plain prose than
 * as a legal footnote.
 *
 * Each entry is a label and a short paragraph on its own hairline rule — the same
 * typographic device as the index grid, at a smaller scale.
 */

const TONES = {
  light: {
    rule: 'bg-line',
    label: '',
    body: 'text-muted-strong',
  },
  surface: {
    rule: 'bg-line',
    label: '',
    body: 'text-muted-strong',
  },
  dark: {
    rule: 'bg-line-invert',
    label: 'text-canvas/75',
    body: 'text-canvas/60',
  },
}

const COLUMNS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function PlainTerms({ items = [], tone = 'light', columns = 2, className = '' }) {
  const rootRef = useRef(null)
  const theme = TONES[tone] ?? TONES.light

  useGSAP(
    () => {
      gsap.utils.toArray('.terms-rule').forEach((rule, index) => {
        drawRule(rule, { trigger: rule, start: 'top 92%', delay: index * 0.06 })
      })

      fadeRise(gsap.utils.toArray('.terms-item'), {
        trigger: rootRef.current,
        start: 'top 88%',
        y: 18,
        stagger: 0.08,
      })
    },
    { scope: rootRef },
  )

  return (
    <ul
      ref={rootRef}
      className={`grid grid-cols-1 gap-x-8 gap-y-10 ${COLUMNS[columns] ?? COLUMNS[2]} ${className}`}
    >
      {items.map((item) => (
        <li key={item.label} className="terms-item">
          <span aria-hidden="true" className={`terms-rule block h-px w-full origin-left ${theme.rule}`} />
          <h3 className={`mt-6 u-eyebrow ${theme.label}`}>{item.label}</h3>
          <p className={`mt-4 max-w-[52ch] text-sm leading-relaxed ${theme.body}`}>{item.body}</p>
        </li>
      ))}
    </ul>
  )
}
