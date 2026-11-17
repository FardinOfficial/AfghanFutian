import { useRef } from 'react'

import Media from '@/components/Media'
import SectionLabel from '@/components/SectionLabel'
import { addLineReveal } from '@/animations/textAnimations'
import { gsap, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * PageHero — the shared opening for every inner page.
 *
 * Keeps the homepage's language (ink ground, directional scrim, hairline rule,
 * display statement on the left, meta rail on the right) while being shorter
 * than the homepage hero so it reads as a chapter opening rather than a second
 * front door.
 *
 * Carries `data-nav-sentinel` so the navbar stays transparent over it.
 */
export default function PageHero({
  index,
  label,
  title,
  description,
  media,
  mediaAlt,
  meta = [],
  children,
}) {
  const rootRef = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const root = rootRef.current
      // Resolved up front and guarded individually: not every page supplies a
      // description or a meta rail (Contact renders its own detail block
      // instead), and a tween aimed at a missing selector logs a GSAP warning
      // and then re-warns on every revert.
      const image = root.querySelector('.page-hero-image')
      const eyebrow = root.querySelector('.page-hero-eyebrow')
      const rule = root.querySelector('.page-hero-rule')
      const description = root.querySelector('.page-hero-desc')
      const meta = gsap.utils.toArray(root.querySelectorAll('.page-hero-meta'))

      const tl = gsap.timeline()

      if (image) {
        tl.fromTo(image, { scale: 1.14 }, { scale: 1, duration: 1.9, ease: 'expo.out' }, 0)
      }
      if (eyebrow) {
        tl.fromTo(
          eyebrow,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          0.15,
        )
      }
      if (rule) {
        tl.fromTo(
          rule,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 1.2, ease: 'expo.out' },
          0.3,
        )
      }

      addLineReveal(tl, root.querySelector('.page-hero-title'), {
        position: 0.28,
        stagger: 0.1,
      })

      if (description) {
        tl.fromTo(
          description,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' },
          0.7,
        )
      }
      if (meta.length) {
        tl.fromTo(
          meta,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' },
          0.85,
        )
      }
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      data-nav-sentinel
      aria-labelledby="page-hero-heading"
      className="relative isolate overflow-hidden bg-ink text-canvas"
    >
      {media && (
        <>
          <div className="absolute inset-0">
            <Media
              src={media}
              alt={mediaAlt}
              sizes="100vw"
              priority
              className="page-hero-image h-full w-full"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(105deg,rgba(20,20,20,0.96)_0%,rgba(20,20,20,0.84)_40%,rgba(20,20,20,0.42)_75%,rgba(20,20,20,0.68)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.94)_0%,rgba(20,20,20,0.2)_45%,transparent_70%)]"
          />
          <div aria-hidden="true" className="grain-layer opacity-[0.05] mix-blend-soft-light" />
        </>
      )}

      <div className="u-container relative z-10 flex min-h-[68svh] flex-col justify-end pb-14 pt-[132px] lg:min-h-[74svh] lg:pb-20 lg:pt-[180px]">
        <div className="page-hero-eyebrow">
          <SectionLabel index={index} tone="dark">
            {label}
          </SectionLabel>
        </div>

        <div className="page-hero-rule mt-8 h-px w-full origin-left bg-line-invert lg:mt-10" />

        <div className="mt-9 grid grid-cols-1 gap-9 lg:mt-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1
              id="page-hero-heading"
              className="page-hero-title max-w-[20ch] font-display text-display-1 font-medium uppercase"
            >
              {title}
            </h1>
          </div>

          <div className="lg:col-span-5 lg:pl-6 lg:pt-2">
            {description && (
              <p className="page-hero-desc u-lead max-w-[46ch] text-canvas/70">{description}</p>
            )}
            {children}
          </div>
        </div>

        {meta.length > 0 && (
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line-invert pt-7 sm:grid-cols-4 lg:mt-16">
            {meta.map((item) => (
              <div key={item.label} className="page-hero-meta">
                <dt className="u-eyebrow text-canvas-muted">{item.label}</dt>
                <dd className="mt-2 font-display text-[0.9375rem] tracking-[-0.01em] text-canvas/85">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
