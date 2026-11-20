import { Component, createRef } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@/components/Button'

/**
 * ErrorBoundary.
 *
 * The only class component in the codebase, because React offers no hook
 * equivalent for error boundaries. It exists for one reason: without it a single
 * thrown render turns the whole site into a blank page — navigation included, so
 * the visitor has no way out but the browser's back button.
 *
 * It is mounted at two scales:
 *
 *   • In `main.jsx`, around the router — the last line of defence.
 *   • In `MainLayout`, around `<Outlet/>` — so a failure inside one page leaves
 *     the navbar and footer intact.
 *
 * Resetting after a failure is the caller's job, not this component's: React
 * remounts a boundary whose `key` changes, and a fresh mount has fresh state.
 * `MainLayout` therefore passes `key={pathname}`, so navigating away clears the
 * error and the next page renders without a reload. That is the pattern React
 * documents for exactly this case, and it keeps this class free of the
 * `componentDidUpdate`-sets-state dance.
 *
 * The fallback deliberately avoids the site's motion and media machinery. If
 * something has already thrown, GSAP or the image registry may be implicated, so
 * the recovery screen is plain markup and CSS.
 *
 * There is no error-reporting service, and none is implied: the error is logged
 * to the console and nowhere else. Wiring one up later means adding a call in
 * `componentDidCatch` and nothing more.
 *
 * The recovery screen lives in a small function component so it can use the
 * translation hook. The class itself stays a class — React has no hook
 * equivalent for error boundaries — and owns only the error state and focus.
 */
function ErrorFallback({ error, fallbackRef }) {
  const { t } = useTranslation()

  return (
    <div
      ref={fallbackRef}
      tabIndex={-1}
      role="alert"
      className="u-container flex min-h-[80vh] flex-col justify-center py-32 outline-none"
    >
      <p className="u-eyebrow">{t('Something went wrong', { ns: 'common' })}</p>

      <h1 className="mt-6 max-w-[22ch] text-display-2 text-ink">
        {t('This page could not be displayed.', { ns: 'common' })}
      </h1>

      <p className="mt-6 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted-strong">
        {t(
          'The problem is at our end, not yours. Reloading usually clears it. If it does not, our contact details are in the footer.',
          { ns: 'common' },
        )}
      </p>

      {/* The stack is useful while developing and noise in production, so it is
          compiled out of the production bundle entirely. */}
      {import.meta.env.DEV && (
        <pre className="mt-8 max-w-full overflow-x-auto border border-line bg-surface p-4 font-sans text-[0.75rem] leading-relaxed text-ink">
          {String(error?.stack ?? error?.message ?? error)}
        </pre>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        <Button onClick={() => window.location.reload()}>{t('Reload the page', { ns: 'common' })}</Button>
        <Button href="/" variant="outline">
          {t('Go to the homepage', { ns: 'common' })}
        </Button>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.fallbackRef = createRef()
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Afghan Futian] Unhandled render error', error, info?.componentStack)

    // Move focus to the recovery panel. The content that had focus has just been
    // unmounted, so without this the caret falls back to <body> and a keyboard
    // user is left at the top of the document with no announcement.
    this.fallbackRef.current?.focus()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return <ErrorFallback error={error} fallbackRef={this.fallbackRef} />
  }
}
