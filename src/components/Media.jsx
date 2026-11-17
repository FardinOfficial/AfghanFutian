import { useState } from 'react'

import { imageSrcSet, imageUrl } from '@/data/media'

/**
 * Media — the single image component used across the site.
 *
 * Responsibilities:
 *  • Build responsive `srcset`/`sizes` from the registry so no component ever
 *    hand-writes a CDN URL.
 *  • Prevent layout shift by reserving space with an aspect ratio before the
 *    bytes arrive.
 *  • Default to `loading="lazy"` + `decoding="async"`, with `priority` opting
 *    a single above-the-fold image back into eager loading.
 *  • Soften the arrival with a scale/opacity settle instead of a hard pop.
 *
 * Accessibility: `alt` is required and is always passed through verbatim. A
 * decorative image must be marked explicitly with `decorative`.
 */
export default function Media({
  src,
  alt,
  sizes = '100vw',
  aspect,
  priority = false,
  decorative = false,
  className = '',
  imgClassName = '',
  style,
  ...props
}) {
  const [loaded, setLoaded] = useState(false)

  if (!src) return null

  const ratio = aspect ?? src.aspect
  const widths = src.widths ?? undefined

  const resolvedAlt = decorative ? '' : alt || src.alt

  return (
    <div
      className={`relative overflow-hidden bg-surface ${className}`}
      style={{
        ...(ratio ? { aspectRatio: ratio } : null),
        ...style,
      }}
      {...props}
    >
      <img
        src={imageUrl(src.id, priority ? 1600 : 1280, { quality: src.quality })}
        srcSet={imageSrcSet(src.id, widths, { quality: src.quality })}
        sizes={sizes}
        alt={resolvedAlt}
        aria-hidden={decorative ? 'true' : undefined}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          loaded ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
        } ${imgClassName}`}
      />
    </div>
  )
}
