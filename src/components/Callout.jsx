/**
 * Callout — a single aside, set as typography.
 *
 * Used for the small notes that would otherwise become an extra section: a
 * caveat on a list, a promise about what happens next, a statement that
 * something is pending. It is a left hairline and a paragraph — no icon, no
 * background fill, no rounded container.
 *
 * `label` is optional and renders as the site's uppercase eyebrow.
 */

const TONES = {
  light: {
    border: 'border-line',
    label: '',
    body: 'text-muted-strong',
  },
  surface: {
    border: 'border-line',
    label: '',
    body: 'text-muted-strong',
  },
  dark: {
    border: 'border-line-invert',
    label: 'text-canvas/75',
    body: 'text-canvas/60',
  },
}

export default function Callout({ label, children, tone = 'light', className = '' }) {
  const theme = TONES[tone] ?? TONES.light

  return (
    <div className={`border-l pl-5 ${theme.border} ${className}`}>
      {label && <p className={`u-eyebrow ${theme.label}`}>{label}</p>}
      <p className={`text-[0.9375rem] leading-relaxed ${theme.body} ${label ? 'mt-3' : ''}`}>
        {children}
      </p>
    </div>
  )
}
