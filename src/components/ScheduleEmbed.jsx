import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, RotateCw } from 'lucide-react'

import { CAL_ORIGINS } from '@/data/scheduling'

/**
 * ScheduleEmbed — the Cal.com booking surface.
 *
 * A plain iframe, deliberately. See `src/data/scheduling.js` for why the
 * JavaScript embed is not used: it would force `script-src` and `style-src` to
 * be loosened in the site's Content-Security-Policy, and this site's CSP is
 * strict on purpose.
 *
 * Sizing
 * ----------------------------------------------------------------------------
 * Cal.com's booker posts `__dimensionChanged` to its parent with the height of
 * its content. Listening for that message lets the frame follow the calendar as
 * the visitor moves from the month view to a slot list to the details form —
 * without loading Cal.com's script. The message is only accepted from a
 * cal.com origin and from this exact iframe; otherwise a fixed, generous height
 * is used and the external link remains the escape hatch.
 *
 * States
 * ----------------------------------------------------------------------------
 * The frame starts in `loading`. It becomes `ready` on load or on Cal.com's
 * `__iframeReady` message. If neither arrives in time, or the frame errors, the
 * visitor sees a real error state with a retry and a direct booking link — never
 * a blank rectangle that looks broken.
 */
const MIN_HEIGHT = 480
const MAX_HEIGHT = 2400
const LOAD_TIMEOUT_MS = 15_000

export default function ScheduleEmbed({ url, publicUrl, title = 'Meeting booking calendar' }) {
  const [status, setStatus] = useState('loading')
  const [height, setHeight] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const iframeRef = useRef(null)

  /* A frame that never reports in must not leave the visitor staring at a
     skeleton forever. Each retry starts a fresh timer. */
  useEffect(() => {
    if (status !== 'loading') return undefined
    const timer = window.setTimeout(() => setStatus('error'), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [status, attempt])

  useEffect(() => {
    const onMessage = (event) => {
      if (!CAL_ORIGINS.includes(event.origin)) return
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return

      const fullType = event.data?.fullType
      if (typeof fullType !== 'string') return

      if (fullType.endsWith('__dimensionChanged')) {
        const next = Number(event.data?.data?.iframeHeight)
        if (Number.isFinite(next) && next >= MIN_HEIGHT && next <= MAX_HEIGHT) {
          setHeight(Math.round(next))
          setStatus('ready')
        }
      } else if (fullType.endsWith('__iframeReady')) {
        setStatus('ready')
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const retry = () => {
    setHeight(null)
    setStatus('loading')
    setAttempt((value) => value + 1)
  }

  return (
    <div className="border border-line bg-surface">
      <div className="relative overflow-hidden">
        <iframe
          key={attempt}
          ref={iframeRef}
          src={url}
          title={title}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setStatus((current) => (current === 'error' ? current : 'ready'))}
          onError={() => setStatus('error')}
          className="block w-full max-w-full border-0 bg-surface"
          style={height ? { height: `${height}px` } : { height: '46rem' }}
        />

        {status === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface"
          >
            <span className="u-eyebrow">Loading the calendar</span>
            <span className="h-px w-20 animate-pulse bg-ink" aria-hidden="true" />
            <span className="text-[0.8125rem] text-muted-strong">Fetching the open times…</span>
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-surface px-6 text-center"
          >
            <span className="u-eyebrow">Calendar unavailable</span>
            <p className="max-w-[38ch] text-[0.9375rem] leading-relaxed text-muted-strong">
              The booking calendar could not be loaded here. You can try again, or open the same
              booking page directly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 border border-ink px-5 py-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:bg-ink hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <RotateCw aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
                Try again
              </button>
              {publicUrl && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="u-link font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink"
                >
                  Open booking page
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {publicUrl && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4">
          <p className="text-[0.8125rem] leading-snug text-muted-strong">
            The calendar opens in Kabul time. Change it with Cal.com's selector, or open it directly.
          </p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="u-link font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink"
          >
            Open in a new tab
            <ArrowUpRight aria-hidden="true" strokeWidth={1.6} className="h-[0.8125rem] w-[0.8125rem]" />
          </a>
        </div>
      )}
    </div>
  )
}
