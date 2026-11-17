/**
 * Afghan Futian lockup — mark + wordmark.
 *
 * The mark is supplied raster artwork, not something we can express as SVG
 * strokes. It is a wide device: the ink is 1611×1074, an aspect of 1.50:1.
 * That ratio matters — drawing it inside a square box is what made the old
 * lockup look undersized, because a 1.5:1 artwork only fills two thirds of a
 * square's height.
 *
 * It ships in two tones:
 *
 *   /logo-mark.png        the original — navy #002060 for light grounds
 *   /logo-mark-light.png  the same artwork in canvas cream for the ink grounds
 *
 * Three of the four places this lockup appears — the navbar over the hero, the
 * mobile overlay and the footer — sit on the ink ground, where the navy
 * artwork would all but disappear. Reversing the value keeps the mark's
 * internal structure; a CSS filter such as `brightness(0) invert(1)` would
 * flatten its many strokes into a single silhouette.
 *
 * Both files are generated from one source by `build_logo_assets.py` (see the
 * README), so they cannot drift apart.
 *
 * Accessibility note: the wordmark is rendered as *plain, visible text* rather
 * than a screen-reader-only string beside an aria-hidden one. Screen readers
 * and sighted users therefore read exactly the same words, which keeps the
 * accessible name of any wrapping link in agreement with its visible label
 * (a mismatch that automated accessibility audits flag, with good reason). The
 * mark itself is decorative and therefore carries an empty `alt`.
 */
export default function Logo({ className = '', showMark = true, size = 'md', onDark = false }) {
  const isLg = size === 'lg'
  const typeSize = isLg ? 'text-[1.5rem]' : 'text-[1.125rem]'
  const markSize = isLg ? 'h-10' : 'h-[1.875rem]'
  const markSrc = onDark ? '/logo-mark-light.png' : '/logo-mark.png'

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {showMark && (
        <img
          src={markSrc}
          alt=""
          width="192"
          height="128"
          decoding="async"
          aria-hidden="true"
          className={`${markSize} w-auto shrink-0 object-contain`}
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
