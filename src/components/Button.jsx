import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

/**
 * The site's only button primitive.
 *
 * Design rationale: sharp rectangles, letterspaced uppercase labels and a
 * fill that wipes upward on hover. No rounded corners and no shadows — the
 * button reads as an architectural plate rather than a UI widget, which is
 * what keeps the interface from looking like a template.
 *
 * Renders as `<Link>` for internal routes, `<a>` for external/mail links and
 * `<button>` otherwise, so semantics always match behaviour.
 */

const BASE =
  'group/btn relative isolate inline-flex items-center justify-center gap-3 overflow-hidden ' +
  'font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] ' +
  'px-7 py-[1.0625rem] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-45'

const VARIANTS = {
  /** Ink plate on light ground. Wipes to accent on hover. */
  solid: {
    surface: 'bg-ink text-canvas',
    wipe: 'bg-accent',
    label: 'group-hover/btn:text-ink',
    focus: 'focus-visible:outline-ink',
  },
  /** Hairline plate on light ground. Wipes to ink. */
  outline: {
    surface: 'border border-line text-ink',
    wipe: 'bg-ink',
    label: 'group-hover/btn:text-canvas',
    focus: 'focus-visible:outline-ink',
  },
  /** Hairline plate for dark sections. Wipes to accent. */
  ghost: {
    surface: 'border border-line-invert text-canvas',
    wipe: 'bg-accent',
    label: 'group-hover/btn:text-ink',
    focus: 'focus-visible:outline-accent',
  },
  /** Accent plate — reserved for a single primary action per view. */
  accent: {
    surface: 'bg-accent text-ink',
    wipe: 'bg-ink',
    label: 'group-hover/btn:text-accent',
    focus: 'focus-visible:outline-ink',
  },
}

const SIZES = {
  md: 'px-7 py-[1.0625rem]',
  lg: 'px-9 py-[1.3125rem] text-xs',
}

const Button = forwardRef(function Button(
  {
    children,
    to,
    href,
    variant = 'solid',
    size = 'md',
    icon = true,
    className = '',
    type = 'button',
    ...props
  },
  ref,
) {
  const theme = VARIANTS[variant] ?? VARIANTS.solid

  const classes = [
    BASE,
    theme.surface,
    theme.focus,
    size === 'lg' ? SIZES.lg : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {/* Hover wipe. Sits behind the label and travels up from below. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 -z-10 translate-y-full transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-y-0 group-focus-visible/btn:translate-y-0 ${theme.wipe}`}
      />
      <span
        className={`relative transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${theme.label}`}
      >
        {children}
      </span>
      {icon && (
        <ArrowUpRight
          aria-hidden="true"
          strokeWidth={1.6}
          className={`relative h-[0.9375rem] w-[0.9375rem] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-[3px] group-hover/btn:-translate-y-[3px] ${theme.label}`}
        />
      )}
    </>
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  if (href) {
    const isExternal = /^https?:\/\//.test(href)
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {content}
    </button>
  )
})

export default Button
