import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

/**
 * ScheduleEmbed — the Cal.com booking surface.
 *
 * A plain iframe, deliberately. See `src/data/scheduling.js` for why the
 * JavaScript embed is not used: it would force `script-src` and `style-src` to
 * be loosened in the site's Content-Security-Policy, and this site's CSP is
 * strict on purpose.
 *
 * The trade-off of an iframe is that the height cannot follow the content — the
 * embed script is what normally resizes it. The frame is therefore given a
 * generous fixed height that covers Cal.com's month view plus the slot list, and
 * a link out to the same booking page is always available as an escape hatch.
 *
 * Accessibility: the iframe carries a real `title`, so it is announced as a
 * named region rather than "frame". The loading state is a live region so a
 * screen-reader user is told the calendar is still arriving.
 */
export default function ScheduleEmbed({ url, publicUrl, title = 'Meeting booking calendar' }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="border border-line bg-surface">
      <div className="relative">
        {!loaded && (
          <div
            role="status"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface"
          >
            <span className="u-eyebrow">Loading the calendar</span>
            <span className="h-px w-16 animate-pulse bg-line" aria-hidden="true" />
          </div>
        )}

        <iframe
          src={url}
          title={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="block h-[38rem] w-full border-0 bg-surface sm:h-[44rem] lg:h-[50rem]"
        />
      </div>

      {publicUrl && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4">
          <p className="text-[0.8125rem] leading-snug text-muted-strong">
            Calendar not loading? Open it directly.
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
