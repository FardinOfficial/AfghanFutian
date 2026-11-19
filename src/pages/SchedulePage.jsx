import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock3, Globe2, Mail, Video } from 'lucide-react'

import NativeScheduler from '@/components/NativeScheduler'
import { CONTACT_DETAILS, ROUTES } from '@/data/navigation'
import { CAL_PUBLIC_URL, SCHEDULE_EVENT } from '@/data/scheduling'
import { timeZoneLabel, zoneLabel } from '@/lib/scheduling'

const COMPANY_ZONE = SCHEDULE_EVENT.companyTimeZone
const COMPANY_ZONE_LABEL = `${timeZoneLabel(COMPANY_ZONE)} (${zoneLabel('2026-01-01T00:00:00.000Z', COMPANY_ZONE)})`

/**
 * Schedule — the only transactional route on the site.
 *
 * The global navbar and footer stay exactly as they are; only this page body is
 * replaced by a compact, product-style booking surface. Availability and
 * reservations are handled by our own server functions, which keep the Cal.com
 * key server-side. Nothing here renders a third-party iframe.
 */
export default function SchedulePage() {
  return (
    <div className="scheduler-page" dir="ltr">
      <div className="scheduler-shell">
        <header className="scheduler-page-head">
          <div>
            <p className="scheduler-kicker">Schedule · Meeting</p>
            <h1>Book a meeting.</h1>
            <p>
              Choose a live open time, add a few details and confirm. Your Google Meet link and a
              secure management link follow by email.
            </p>
          </div>
          <div className="scheduler-head-meta">
            <span className="scheduler-chip">
              <Clock3 aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
              {SCHEDULE_EVENT.durationMinutes} minutes
            </span>
            <span className="scheduler-chip">
              <Video aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
              Google Meet
            </span>
            <span className="scheduler-chip">
              <Globe2 aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
              Default: {COMPANY_ZONE_LABEL}
            </span>
          </div>
        </header>

        <NativeScheduler />

        <footer className="scheduler-page-foot">
          <span>
            Minimum notice {SCHEDULE_EVENT.minNoticeMinutes} minutes · Meetings are hosted in{' '}
            {COMPANY_ZONE_LABEL}. You can change the timezone in the booking card.
          </span>
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to={ROUTES.contact}>Send an enquiry instead</Link>
            <a href={CONTACT_DETAILS.emailHref} className="inline-flex items-center gap-1.5">
              <Mail aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
              {CONTACT_DETAILS.email}
            </a>
            {CAL_PUBLIC_URL && (
              <a href={CAL_PUBLIC_URL} target="_blank" rel="noreferrer noopener">
                Open Cal.com directly
                <ArrowUpRight aria-hidden="true" strokeWidth={1.6} className="ml-1 inline h-3.5 w-3.5" />
              </a>
            )}
          </span>
        </footer>
      </div>
    </div>
  )
}
