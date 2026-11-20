import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EASE, gsap, useGSAP } from '@/lib/gsap'
import { markIntroComplete } from '@/lib/intro'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Preloader.
 *
 * Three jobs, in order of importance:
 *   1. Cover the hero while webfonts settle, so the user never sees a flash of
 *      fallback type.
 *   2. Deliver the brand statement before any content — a deliberate,
 *      cinematic opening rather than a spinner.
 *   3. Hand over cleanly. `markIntroComplete()` fires as the curtain starts to
 *      lift, not after, so the hero's choreography is already underway behind
 *      the receding panel. That overlap is what makes the transition feel like
 *      one continuous shot instead of two animations.
 *
 * Timing is deliberately two-phase rather than "load as fast as possible":
 *
 *   Phase 1 — the opening. A fixed 1.2s timeline that reveals the wordmark and
 *   climbs the bar to 90%. This is the minimum dwell; it is what makes the
 *   splash read as an opening title rather than a flash of black.
 *
 *   Phase 2 — the exit. Only starts once BOTH the opening has finished and the
 *   real readiness signal has arrived (`document.fonts.ready`). Sequencing
 *   them this way is not just aesthetic: it guarantees a single writer for the
 *   progress counter. Running the exit concurrently with the opening put two
 *   tweens on the same object and made the counter jump.
 *
 * We deliberately do *not* wait on `window.load`: the hero photograph is
 * large, and gating the curtain on it would hold a perfectly usable page
 * hostage for no visual gain. The image reveals behind the curtain on its own
 * timeline. A 1.5s ceiling on the font wait means a slow network can never
 * trap the user here.
 */

const CEILING_MS = 1500
const CLIMB_TO = 90

export default function Preloader({ onComplete, ready }) {
  const { t } = useTranslation()
  const rootRef = useRef(null)
  const counterRef = useRef(null)
  const barRef = useRef(null)

  /** Shared tween target. Mutated by GSAP, read by `onUpdate`. */
  const progress = useRef({ value: 0 })
  const [assetsReady, setAssetsReady] = useState(false)
  const [openingComplete, setOpeningComplete] = useState(false)
  const [shouldRender, setShouldRender] = useState(() => !prefersReducedMotion())

  /**
   * Mirror the shared `progress` value into the DOM. Declared before the
   * timelines that reference it so the read is unambiguous.
   */
  function renderProgress() {
    const value = Math.round(progress.current.value)
    if (counterRef.current) {
      counterRef.current.textContent = String(value).padStart(3, '0')
    }
    if (barRef.current) {
      gsap.set(barRef.current, { scaleX: progress.current.value / 100 })
    }
  }

  /* ---- Real readiness signal ------------------------------------------ */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined

    let cancelled = false

    const fonts = document.fonts?.ready ?? Promise.resolve()
    // On a language change the layout hands us a gate that only opens once the
    // translated copy has rendered and its webfont has loaded. On the first
    // load there is no gate, so this is identical to the original font wait.
    const gate = ready ?? Promise.resolve()
    const ceiling = new Promise((resolve) => setTimeout(resolve, CEILING_MS))

    Promise.race([Promise.all([fonts, gate]), ceiling]).then(() => {
      if (!cancelled) setAssetsReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [ready])

  /* ---- Reduced motion: skip entirely ---------------------------------- */
  useEffect(() => {
    if (prefersReducedMotion()) {
      markIntroComplete()
      setShouldRender(false)
      onComplete?.()
    }
  }, [onComplete])

  /* ---- Phase 1: opening choreography ---------------------------------- */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const tl = gsap.timeline({ onComplete: () => setOpeningComplete(true) })

      tl.fromTo(
        '.preloader-brand-line',
        { yPercent: 118 },
        { yPercent: 0, duration: 1, ease: EASE.reveal, stagger: 0.09 },
        0.1,
      )
        .fromTo(
          '.preloader-meta',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, ease: EASE.editorial, stagger: 0.07 },
          0.35,
        )
        .to(
          progress.current,
          {
            value: CLIMB_TO,
            duration: 1,
            ease: 'power2.out',
            onUpdate: renderProgress,
          },
          0.2,
        )
    },
    { scope: rootRef },
  )

  /* ---- Phase 2: completion + curtain lift ------------------------------ */
  useGSAP(
    () => {
      if (prefersReducedMotion() || !assetsReady || !openingComplete) return

      const tl = gsap.timeline({
        onComplete: () => {
          setShouldRender(false)
          onComplete?.()
        },
      })

      // Finish the bar, then get out of the way. By this point the opening
      // tween on `progress` has ended, so this is the only writer.
      tl.to(progress.current, {
        value: 100,
        duration: 0.3,
        ease: 'power1.inOut',
        onUpdate: renderProgress,
      })
        .to('.preloader-meta', { opacity: 0, duration: 0.26, ease: 'power1.out' }, '-=0.16')
        .add(() => markIntroComplete(), '-=0.2')
        .to(
          '.preloader-brand-line',
          { yPercent: -118, duration: 0.62, ease: EASE.architectural, stagger: 0.04 },
          '-=0.06',
        )
        .to(
          rootRef.current,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 0.78,
            ease: EASE.architectural,
          },
          '-=0.46',
        )
    },
    { dependencies: [assetsReady, openingComplete], scope: rootRef },
  )

  if (!shouldRender) return null

  return (
    /* The preloader is a fixed cinematic overlay, not page content: keep its
       composition identical in every language so switching locale never
       mirrors the curtain. Only its copy is translated. */
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label={t('Loading Afghan Futian', { ns: 'common' })}
      dir="ltr"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-ink px-[var(--spacing-gutter)] py-8 text-left text-canvas will-change-[clip-path] sm:py-10"
    >
      {/* Top rail */}
      <div className="flex items-start justify-between gap-6">
        <p className="preloader-meta u-eyebrow text-canvas-muted">
          {t('Sourcing & Trade', { ns: 'common' })}
        </p>
        <p className="preloader-meta u-eyebrow hidden text-canvas-muted sm:block">
          {t('Connecting Markets. Moving the World.', { ns: 'common' })}
        </p>
      </div>

      {/* Brand statement.
          Deliberately a <div>, not an <h1>: this is a decorative loading
          splash, and giving it heading semantics would put a second, wrong
          <h1> at the top of every page for crawlers and screen readers. The
          role="status" wrapper above is what actually announces loading. */}
      <div aria-hidden="true" className="w-full">
        <p className="font-display text-hero font-medium uppercase">
          <span className="line-mask">
            <span className="preloader-brand-line line-inner">Afghan</span>
          </span>
          <span className="line-mask">
            <span className="preloader-brand-line line-inner">Futian</span>
          </span>
        </p>
      </div>

      {/* Progress rail */}
      <div className="w-full">
        <div className="h-px w-full overflow-hidden bg-canvas/20">
          <div
            ref={barRef}
            className="h-full w-full origin-left scale-x-0 bg-accent"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
        <div className="mt-5 flex items-end justify-between gap-6">
          <p className="preloader-meta u-eyebrow text-canvas-muted">
            {t('Preparing your view', { ns: 'common' })}
          </p>
          <p
            ref={counterRef}
            className="preloader-meta font-display text-[0.9375rem] tabular-nums tracking-[0.08em] text-canvas"
          >
            000
          </p>
        </div>
      </div>
    </div>
  )
}
