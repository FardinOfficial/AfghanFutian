import { forwardRef } from 'react'
import { ArrowUpRight } from 'lucide-react'

import { LocaleLink } from '@/i18n/LocaleLink'

/**
 * The site's only button primitive.
 *
 * Design rationale: sharp rectangles, letterspaced uppercase labels and a
 * fill that wipes upward on hover. No rounded corners — the button reads as an
 * architectural plate rather than a UI widget, which is what keeps the
 * interface from looking like a template.
 *
 * Hover is a colour transition and a soft lift, nothing more. The accent fill
 * wipes up behind the label, the label inverts, the arrow nudges — all of it
 * colour and position, none of it scale. The one addition is a wide, low-opacity
 * shadow that only appears on hover: it reads as the plate rising very slightly
 * off the page, and because it is tinted to the ink token it is invisible on the
 * dark grounds where it would only muddy the photograph behind it. Dimensions
 * never change, so nothing on the page reflows when the pointer arrives.
 *
 * Renders as `<Link>` for internal routes, `<a>` for external/mail links and
 * `<button>` otherwise, so semantics always match behaviour.
 */

const BASE =
  'group/btn relative isolate inline-flex items-center justify-center gap-3 overflow-hidden ' +
  'font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] ' +
  'px-7 py-[1.0625rem] ' +
  'transition-[color,background-color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'hover:shadow-[0_18px_40px_-24px_rgba(20,20,20,0.65)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-45'

const VARIANTS = {
  /** Ink plate on light ground. Wipes to accent on hover. */
  solid: {
    surface: 'bg-ink text-canvas',
    wipe: 'bg-accent',
    label: 'group-hover/btn:text-on-accent',
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
    label: 'group-hover/btn:text-on-accent',
    focus: 'focus-visible:outline-accent-on-dark',
  },
  /** Accent plate — reserved for a single primary action per view. */
  accent: {
    surface: 'bg-accent text-on-accent',
    wipe: 'bg-ink',
    label: 'group-hover/btn:text-accent-on-dark',
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
          className={`relative h-[0.9375rem] w-[0.9375rem] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-[3px] group-hover/btn:-translate-y-[3px] rtl:-scale-x-100 ${theme.label}`}
        />
      )}
    </>
  )

  if (to) {
    return (
      <LocaleLink ref={ref} to={to} className={classes} {...props}>
        {content}
      </LocaleLink>
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
