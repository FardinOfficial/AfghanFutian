/**
 * Afghan Futian wordmark.
 *
 * The mark is an abstract "flow" device: an outlined square (a container, a
 * market, a boundary) bisected by an ascending arrow (movement, connection).
 * Drawn on a 28×28 grid so it stays crisp from favicon to hero scale.
 *
 * `currentColor` drives the stroke and fill, so the mark inherits the
 * surrounding text colour and works on both light and dark sections without a
 * variant prop.
 *
 * Accessibility note: the wordmark is rendered as *plain, visible text* rather
 * than a screen-reader-only string beside an aria-hidden one. Screen readers
 * and sighted users therefore read exactly the same words, which keeps the
 * accessible name of any wrapping link in agreement with its visible label
 * (a mismatch that automated accessibility audits flag, with good reason).
 */
export function LogoMark({ className = 'h-7 w-7' }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Boundary */}
      <rect x="1" y="1" width="26" height="26" stroke="currentColor" strokeWidth="1.25" />
      {/* Ascending connection */}
      <path d="M4 20.5 L24 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
      {/* Arrowhead */}
      <path d="M17.5 7.5 H24 V13.5" stroke="currentColor" strokeWidth="1.25" />
      {/* Accent anchor */}
      <rect x="4" y="20.5" width="3" height="3" fill="currentColor" />
    </svg>
  )
}

/**
 * Full lockup: mark + wordmark. Used in the navbar, the mobile overlay and the
 * footer. Scales via the `size` prop rather than separate components.
 */
export default function Logo({ className = '', showMark = true, size = 'md' }) {
  const typeSize = size === 'lg' ? 'text-[1.5rem]' : 'text-[1.0625rem]'
  const markSize = size === 'lg' ? 'h-9 w-9' : 'h-[1.375rem] w-[1.375rem]'

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {showMark && <LogoMark className={`${markSize} shrink-0`} />}
      <span
        className={`whitespace-nowrap font-display font-medium uppercase leading-none tracking-[-0.02em] ${typeSize}`}
      >
        Afghan Futian
      </span>
    </span>
  )
}
