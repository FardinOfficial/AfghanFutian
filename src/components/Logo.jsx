/**
 * Afghan Futian lockup — mark + wordmark.
 *
 * The mark ships as a raster asset rather than a drawn SVG, because the brand
 * artwork is not something we can express as strokes. It comes in two tones:
 *
 *   /logo-mark.png        the original — a dark navy mark for light grounds
 *   /logo-mark-light.png  value-reversed — a cream mark for the ink grounds
 *
 * One file cannot serve both. Three of the four places this lockup appears —
 * the navbar over the hero, the mobile overlay and the footer — sit on the ink
 * ground, where the original navy artwork would all but disappear. Reversing
 * the two tones preserves the mark's internal structure; a CSS filter such as
 * `brightness(0) invert(1)` would flatten both tones into a single silhouette
 * and throw that structure away.
 *
 * The reversed file is generated from the original, not drawn separately, so
 * the two can never drift apart. See the README.
 *
 * Accessibility note: the wordmark is rendered as *plain, visible text* rather
 * than a screen-reader-only string beside an aria-hidden one. Screen readers
 * and sighted users therefore read exactly the same words, which keeps the
 * accessible name of any wrapping link in agreement with its visible label
 * (a mismatch that automated accessibility audits flag, with good reason). The
 * mark itself is decorative and therefore carries an empty `alt`.
 */
export default function Logo({ className = '', showMark = true, size = 'md', onDark = false }) {
  const typeSize = size === 'lg' ? 'text-[1.5rem]' : 'text-[1.0625rem]'
  const markSize = size === 'lg' ? 'h-9 w-9' : 'h-[1.375rem] w-[1.375rem]'
  const markSrc = onDark ? '/logo-mark-light.png' : '/logo-mark.png'

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {showMark && (
        <img
          src={markSrc}
          alt=""
          width="128"
          height="128"
          decoding="async"
          aria-hidden="true"
          className={`${markSize} shrink-0 object-contain`}
        />
      )}
      <span
        className={`whitespace-nowrap font-display font-medium uppercase leading-none tracking-[-0.02em] ${typeSize}`}
      >
        Afghan Futian
      </span>
    </span>
  )
}
