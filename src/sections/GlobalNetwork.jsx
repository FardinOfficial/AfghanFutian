import { useRef } from 'react'

import Media from '@/components/Media'
import SectionLabel from '@/components/SectionLabel'
import { MEDIA } from '@/data/media'
import { useHome } from '@/i18n/hooks'
import { drawRule, fadeRise, imageReveal, parallax } from '@/animations/scrollAnimations'
import { addLineReveal } from '@/animations/textAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * GLOBAL NETWORK
 * ============================================================================
 * "Global network" is the heading most likely to attract invented offices,
 * invented trade lanes and invented volumes. This section refuses all three.
 * Instead it describes the *shape* of the operation as three stations on one
 * rail — a sourcing origin, a single coordination point, and destinations
 * reached per requirement — and then states, in the interface, what the diagram
 * is not.
 *
 * Composition rules:
 *  • One continuous hairline runs across all three stations. It is the only
 *    structural line in the section, and it draws in left to right so the rail
 *    assembles in the direction the operation moves.
 *  • Status is carried by a single square per station: filled accent for
 *    confirmed, hollow hairline for unconfirmed. No badges, no pills.
 *  • The ground is ink. It sits between two canvas sections, which gives the
 *    page a chapter break at exactly the point where the subject turns from
 *    capability to geography.
 *
 * Three-layer image construction, as in Introduction: frame holds the
 * clip-path, the middle layer holds the scroll-scrubbed parallax, the inner
 * layer holds the scale settle. Splitting the transforms keeps two GSAP tweens
 * from ever writing to the same transform on the same node.
 */

export default function GlobalNetwork() {
  const { NETWORK } = useHome()

  const rootRef = useRef(null)

  const headingRef = useRef(null)
  const supportRef = useRef(null)
  const mediaFrameRef = useRef(null)
  const mediaParallaxRef = useRef(null)
  const mediaScaleRef = useRef(null)

  useGSAP(
    () => {
      const intro = gsap.timeline({
        scrollTrigger: { trigger: headingRef.current, start: 'top 80%', once: true },
      })
      addLineReveal(intro, headingRef.current, { position: 0 })
      // `aria: 'none'` — `aria-label` is prohibited on a <p> (role `paragraph`).
      addLineReveal(intro, supportRef.current, { position: 0.16, aria: 'none' })

      // The rail assembles left to right, station by station.
      gsap.utils.toArray('.network-rule').forEach((rule, index) => {
        drawRule(rule, { trigger: rule, start: 'top 90%', delay: index * 0.09 })
      })

      fadeRise(gsap.utils.toArray('.network-station'), {
        trigger: '.network-stations',
        start: 'top 88%',
        y: 26,
        stagger: 0.1,
      })

      fadeRise(gsap.utils.toArray('.network-ledger'), {
        trigger: '.network-ledger-wrap',
        start: 'top 90%',
        y: 20,
        stagger: 0.1,
      })

      imageReveal(mediaFrameRef.current, mediaScaleRef.current)
      parallax(mediaParallaxRef.current, { distance: 10 })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      id="global-network"
      aria-labelledby="network-heading"
      className="u-section relative isolate overflow-hidden bg-ink text-canvas"
    >
      <div aria-hidden="true" className="grain-layer opacity-[0.04] mix-blend-soft-light" />

      <div className="u-container relative">
        <SectionLabel index={NETWORK.index} tone="dark">
          {NETWORK.label}
        </SectionLabel>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <h2
            id="network-heading"
            ref={headingRef}
            className="font-display text-display-1 max-w-[18ch] font-medium uppercase lg:col-span-7"
          >
            {NETWORK.heading}
          </h2>

          <p
            ref={supportRef}
            className="max-w-[46ch] text-lead text-canvas/70 lg:col-span-4 lg:col-start-9 lg:pt-3"
          >
            {NETWORK.support}
          </p>
        </div>

        {/* ---- The rail ------------------------------------------------------ */}
        <ol className="network-stations mt-16 grid grid-cols-1 lg:mt-24 lg:grid-cols-3 lg:gap-8">
          {NETWORK.stations.map((station) => {
            const confirmed = station.status === 'confirmed'

            return (
              <li key={station.index} className="network-station">
                <span
                  aria-hidden="true"
                  className="network-rule block h-px w-full origin-left bg-line-invert"
                />

                <div className="flex items-center justify-between gap-4 pt-6">
                  <span className="u-eyebrow tabular-nums text-canvas-muted">{station.index}</span>

                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={
                        confirmed
                          ? 'h-[7px] w-[7px] shrink-0 bg-accent-on-dark'
                          : 'h-[7px] w-[7px] shrink-0 border border-line-invert'
                      }
                    />
                    <span className="u-eyebrow text-canvas-muted">{station.statusLabel}</span>
                  </span>
                </div>

                <h3 className="mt-8 font-display text-display-3 font-medium uppercase">
                  {station.place}
                </h3>
                <p className="mt-2.5 u-eyebrow text-canvas-muted">{station.role}</p>
                <p className="mt-6 max-w-[36ch] text-sm leading-relaxed text-canvas/60">
                  {station.detail}
                </p>
              </li>
            )
          })}
        </ol>

        {/* ---- Honesty ledger ------------------------------------------------ */}
        <div className="network-ledger-wrap mt-14 grid grid-cols-1 gap-8 lg:mt-20 lg:grid-cols-12 lg:gap-8">
          {NETWORK.ledger.map((item, index) => (
            <div
              key={item.label}
              className={`network-ledger border-t border-line-invert pt-7 lg:col-span-5 ${
                index === 1 ? 'lg:col-start-8' : ''
              }`}
            >
              <h3 className="u-eyebrow text-canvas/75">{item.label}</h3>
              <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-canvas/60">{item.body}</p>
            </div>
          ))}
        </div>

        {/* ---- Horizon ------------------------------------------------------- */}
        <figure className="mt-16 lg:mt-24">
          <div ref={mediaFrameRef} className="u-frame aspect-[16/9] will-change-[clip-path]">
            <div
              ref={mediaParallaxRef}
              className="absolute inset-x-0 -bottom-[8%] -top-[8%] will-change-transform"
            >
              <div ref={mediaScaleRef} className="h-full w-full">
                <Media src={MEDIA.networkHorizon} sizes="100vw" className="h-full w-full" />
              </div>
            </div>
          </div>

          <figcaption className="mt-4 text-[0.6875rem] uppercase leading-relaxed tracking-[0.14em] text-canvas-muted">
            {NETWORK.mediaNote}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
