import { useEffect, useRef, useState } from 'react'

import { gsap } from '@/lib/gsap'
import { shouldEnableCustomCursor } from '@/lib/motion'

/**
 * CustomCursor.
 *
 * Two elements on independent easing curves: a fast accent dot that tracks the
 * pointer almost exactly, and a slower hairline ring that trails behind it.
 * That lag is the entire effect — it reads as weight.
 *
 * The ring inverts whatever is beneath it (`mix-blend-difference`), so a single
 * implementation works on the canvas, on ink sections and over photography
 * without a single variant.
 *
 * Blend-mode caveat — the reason there is no wrapper element
 * ----------------------------------------------------------------------------
 * A stacking context is an *isolated group* for blending. Wrapping both cursor
 * elements in one `position: fixed` + `z-index` div therefore confines their
 * `mix-blend-difference` to that div's own backdrop — which is transparent — so
 * the cursor paints as plain white and disappears on the light canvas. The two
 * elements are rendered as siblings carrying their own `z-index` instead: an
 * element's *own* blend mode still reaches the page even when the element
 * creates a stacking context, only its *descendants* are isolated.
 *
 * The ring also only blends while idle. Once it fills with the accent and shows
 * its label it switches to normal blending, because difference-blending the
 * accent against a light ground produces an unrelated colour rather than the
 * brand's.
 *
 * Guard rails:
 *  • Enabled only for precise, hovering pointers at desktop widths.
 *  • Never enabled under `prefers-reduced-motion`.
 *  • Purely decorative: `aria-hidden`, `pointer-events: none`, and the native
 *    cursor is only hidden once this component is actually running (so a
 *    failure here can never leave a user with no cursor at all).
 *  • Targets opt in declaratively via `data-cursor` / `data-cursor-label`.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false)

  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const labelRef = useRef(null)

  // Capability check runs after mount so it always sees the real environment.
  useEffect(() => {
    setEnabled(shouldEnableCustomCursor())
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return undefined

    document.body.classList.add('has-custom-cursor')

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, opacity: 0 })

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' })
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' })

    let visible = false
    const show = () => {
      if (visible) return
      visible = true
      gsap.to([ring, dot], { opacity: 1, duration: 0.35, ease: 'power2.out' })
    }
    const hide = () => {
      if (!visible) return
      visible = false
      gsap.to([ring, dot], { opacity: 0, duration: 0.25, ease: 'power2.out' })
    }

    const onMove = (event) => {
      ringX(event.clientX)
      ringY(event.clientY)
      dotX(event.clientX)
      dotY(event.clientY)
      show()
    }

    /* ---- Hover states, handled by delegation ---------------------------- */
    const ringSize = { base: 44, active: 88 }

    /** Tracked so a fast hover-out/hover-in cannot restore the blend mode late. */
    let ringActive = false

    const setActive = (active, label = '') => {
      const size = active ? ringSize.active : ringSize.base
      ringActive = active

      // See the blend-mode note above: an accent fill must not be
      // difference-blended, so the ring only blends while it is a bare outline.
      if (active) ring.style.mixBlendMode = 'normal'

      gsap.to(ring, {
        width: size,
        height: size,
        backgroundColor: active ? 'var(--color-accent)' : 'rgba(255,255,255,0)',
        borderColor: active ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.85)',
        duration: 0.45,
        ease: 'power3.out',
        onComplete: () => {
          if (!ringActive) ring.style.mixBlendMode = 'difference'
        },
      })
      gsap.to(dot, {
        scale: active ? 0 : 1,
        duration: 0.35,
        ease: 'power3.out',
      })
      if (labelRef.current) {
        labelRef.current.textContent = label
        gsap.to(labelRef.current, {
          opacity: active && label ? 1 : 0,
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }

    const onOver = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-cursor]') : null
      if (target) setActive(true, target.getAttribute('data-cursor-label') ?? '')
    }

    const onOut = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-cursor]') : null
      if (!target) return
      // Only deactivate when the pointer genuinely leaves the target subtree.
      const next = event.relatedTarget
      if (next instanceof Node && target.contains(next)) return
      setActive(false)
    }

    const onLeaveWindow = () => hide()
    const onEnterWindow = () => show()

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveWindow)
    document.documentElement.addEventListener('pointerenter', onEnterWindow)

    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
      document.documentElement.removeEventListener('pointerenter', onEnterWindow)
      gsap.killTweensOf([ring, dot])
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      {/* No wrapper: see the blend-mode note above. Each element carries its own
          `z-index` so it still paints above the navbar. */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[95] hidden items-center justify-center rounded-full border border-white/85 mix-blend-difference lg:flex"
        style={{ width: 44, height: 44 }}
      >
        <span
          ref={labelRef}
          className="font-sans text-[0.5625rem] font-medium uppercase tracking-[0.16em] text-ink opacity-0"
        >
          {''}
        </span>
      </div>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[95] hidden h-[5px] w-[5px] rounded-full bg-white mix-blend-difference lg:block"
      />
    </>
  )
}
