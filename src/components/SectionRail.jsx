import { useRef } from 'react'

import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * SectionRail — a numbered sequence threaded onto a single continuous line.
 *
 * The site already has `IndexGrid`, which gives every entry its own rule. This
 * is the other device: one line, four stations on it, so the items read as
 * points along a route rather than four parallel cells. Supply Chain uses it
 * because that page's whole argument is a *thread* — one line running from the
 * requirement through to export — and the layout should say so before the copy
 * does.
 *
 * Two orientations, one line
 * ----------------------------------------------------------------------------
 * The rail is vertical below `lg` (each station sits beside it) and horizontal
 * from `lg` up (each station hangs beneath it). Both are drawn in on entry —
 * `scaleY` for the vertical, `scaleX` for the horizontal — so the thread
 * extends itself as the section arrives. A small square marks each station on
 * the line.
 *
 * Accessibility: the stations are a real sequence, so the list is an `<ol>`. The
 * visible numbers are `aria-hidden`, so a screen reader takes the order from the
 * list itself rather than hearing "zero one" before every title. Under reduced
 * motion both rails snap to their full length and the stations appear in place.
 */

const TONES = {
  light: {
    rail: 'bg-line',
    node: 'bg-ink',
    body: 'text-muted-strong',
    meta: 'u-eyebrow',
  },
  surface: {
    rail: 'bg-line',
    node: 'bg-ink',
    body: 'text-muted-strong',
    meta: 'u-eyebrow',
  },
  dark: {
    rail: 'bg-line-invert',
    node: 'bg-accent',
    body: 'text-canvas/60',
    meta: 'u-eyebrow text-canvas-muted',
  },
}

export default function SectionRail({ items = [], tone = 'light', className = '' }) {
  const rootRef = useRef(null)
  const railVRef = useRef(null)
  const railHRef = useRef(null)

  const theme = TONES[tone] ?? TONES.light

  useGSAP(
    () => {
      drawRule(railVRef.current, {
        trigger: rootRef.current,
        start: 'top 84%',
        duration: 1.5,
        axis: 'y',
      })
      drawRule(railHRef.current, {
        trigger: rootRef.current,
        start: 'top 84%',
        duration: 1.5,
      })

      fadeRise(gsap.utils.toArray('.rail-station'), {
        trigger: rootRef.current,
        start: 'top 82%',
        y: 24,
        stagger: 0.1,
      })
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* The rail. Two elements rather than one rotated line: each keeps a
          single, predictable transform axis, and the mobile rail never has to
          fight the desktop one for the same origin. */}
      <span
        ref={railVRef}
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-px origin-top lg:hidden ${theme.rail}`}
      />
      <span
        ref={railHRef}
        aria-hidden="true"
        className={`absolute left-0 top-0 hidden h-px w-full origin-left lg:block ${theme.rail}`}
      />

      <ol className="grid grid-cols-1 gap-y-14 lg:grid-cols-4 lg:gap-x-8">
        {items.map((item) => (
          <li
            key={item.index ?? item.title}
            className="rail-station relative pl-8 lg:pl-0 lg:pt-9"
          >
            <span
              aria-hidden="true"
              className={`absolute left-[-3px] top-[0.35rem] h-[7px] w-[7px] lg:left-0 lg:top-[-3px] ${theme.node}`}
            />

            {item.index && (
              <span aria-hidden="true" className="u-eyebrow tabular-nums">
                {item.index}
              </span>
            )}

            <h3 className={`font-display text-display-3 font-medium uppercase ${item.index ? 'mt-5' : ''}`}>
              {item.title}
            </h3>

            <p className={`mt-4 max-w-[34ch] text-sm leading-relaxed ${theme.body}`}>{item.body}</p>

            {item.meta && <p className={`mt-6 ${theme.meta}`}>{item.meta}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
