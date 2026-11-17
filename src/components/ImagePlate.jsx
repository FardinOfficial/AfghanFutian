import { useRef } from 'react'

import Media from '@/components/Media'
import { imageReveal, parallax } from '@/animations/scrollAnimations'
import { useGSAP } from '@/lib/gsap'

/**
 * ImagePlate — a photograph with the site's standard reveal and drift.
 *
 * Three-layer construction, which is the rule everywhere on this site:
 *
 *    frame    → holds the clip-path reveal (overflow hidden, fixed aspect)
 *    parallax → carries the scroll-scrubbed yPercent
 *    scale    → carries the one-shot scale settle
 *
 * Three nested elements for three transforms, so no two GSAP tweens ever write
 * to the same transform on the same node. Putting clip, y and scale on a single
 * element works right up until two of them run at the same time, and then the
 * transforms start overwriting each other.
 *
 * The parallax layer is oversized by half the travel plus a small margin, which
 * is why the drift never exposes an edge at either extreme.
 *
 * Accessibility: `caption` is a real `<figcaption>`. When no caption is given the
 * image keeps its own `alt` from the registry, which describes the placeholder.
 */

const TONES = {
  light: 'text-muted-strong',
  surface: 'text-muted-strong',
  dark: 'text-canvas-muted',
}

export default function ImagePlate({
  src,
  alt,
  sizes = '100vw',
  aspect = 'aspect-[16/9]',
  caption,
  tone = 'light',
  distance = 10,
  priority = false,
  className = '',
  imgClassName = '',
}) {
  const frameRef = useRef(null)
  const parallaxRef = useRef(null)
  const scaleRef = useRef(null)

  const overscan = distance / 2 + 3

  useGSAP(
    () => {
      imageReveal(frameRef.current, scaleRef.current)
      parallax(parallaxRef.current, { distance })
    },
    { scope: frameRef },
  )

  if (!src) return null

  return (
    <figure className={className}>
      <div ref={frameRef} className={`u-frame ${aspect} will-change-[clip-path]`}>
        <div
          ref={parallaxRef}
          className="absolute inset-x-0 will-change-transform"
          style={{ top: `-${overscan}%`, bottom: `-${overscan}%` }}
        >
          <div ref={scaleRef} className="h-full w-full">
            <Media
              src={src}
              alt={alt}
              sizes={sizes}
              priority={priority}
              className="h-full w-full"
              imgClassName={imgClassName}
            />
          </div>
        </div>
      </div>

      {caption && (
        <figcaption
          className={`mt-4 text-[0.6875rem] uppercase leading-relaxed tracking-[0.14em] ${TONES[tone] ?? TONES.light}`}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
