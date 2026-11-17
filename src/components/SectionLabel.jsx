/**
 * SectionLabel — the small uppercase "tick" that opens every section.
 *
 * Anatomy: an index number, a short hairline rule, then the label. The rule is
 * what gives the pattern its editorial feel; without it this is just another
 * eyebrow.
 *
 * The whole unit is one flex row so the rule length stays proportional to the
 * label rather than the container.
 */
export default function SectionLabel({ index, children, tone = 'light', className = '' }) {
  const isDark = tone === 'dark'

  return (
    <div
      className={`flex items-center gap-4 ${className}`}
      style={{ '--rule-color': isDark ? 'var(--color-line-invert)' : 'var(--color-line)' }}
    >
      {index && (
        <span className={`u-eyebrow tabular-nums ${isDark ? 'text-canvas-muted' : ''}`}>
          {index}
        </span>
      )}
      <span
        aria-hidden="true"
        className="h-px w-8 shrink-0 bg-[var(--rule-color)] sm:w-12"
      />
      <span className={`u-eyebrow ${isDark ? 'text-canvas/75' : ''}`}>{children}</span>
    </div>
  )
}
