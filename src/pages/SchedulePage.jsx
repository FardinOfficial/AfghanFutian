import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Clock3, Globe2, Mail } from 'lucide-react'

import Button from '@/components/Button'
import NativeScheduler from '@/components/NativeScheduler'
import PageHero from '@/components/PageHero'
import SectionIntro from '@/components/SectionIntro'
import { CONTACT_DETAILS, ROUTES } from '@/data/navigation'
import { CAL_PUBLIC_URL, SCHEDULE_COPY, SCHEDULE_EVENT } from '@/data/scheduling'

/**
 * Schedule.
 *
 * The one page on the site that performs a transaction rather than making an
 * argument, so it is built differently from every other inner page:
 *
 *   • No photograph. Every other page opens on a plate; this one opens on ink
 *     alone, which is the same choice the legal documents make and for the same
 *     reason — it is a utility, and a decorative image would only push the thing
 *     the reader came for further down.
 *   • No closing CTA suppression. The layout's global closing block still
 *     appears here, which is correct: if the reader does not want to book, the
 *     enquiry form is the right next step, not a dead end.
 *
 * The booking surface is native to this site. Availability and reservations
 * come from our own server functions, which hold the private Cal.com key; the
 * browser never sees that key and never renders a third-party iframe.
 */
export default function SchedulePage() {
  return (
    <>
      <PageHero
        index="08"
        label={SCHEDULE_COPY.label}
        title={SCHEDULE_COPY.heading}
        description={SCHEDULE_COPY.support}
      >
        <ul className="mt-9 space-y-5 border-t border-line-invert pt-7">
          <li className="flex items-start gap-4">
            <Clock3 aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="u-eyebrow text-canvas-muted">
                {SCHEDULE_EVENT.durationMinutes} minutes · {SCHEDULE_EVENT.location}
              </p>
              <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-canvas/85">
                {SCHEDULE_EVENT.minNoticeMinutes}-minute minimum notice. Company time is{' '}
                {SCHEDULE_EVENT.companyTimeZone.replace('_', ' ')}.
              </p>
            </div>
          </li>
          <li>
            <p className="u-eyebrow text-canvas-muted">Prefer to write</p>
            <a href={CONTACT_DETAILS.emailHref} className="u-link mt-2 text-sm text-canvas/85">
              {CONTACT_DETAILS.email}
            </a>
          </li>
          <li>
            <p className="u-eyebrow text-canvas-muted">Have a detailed requirement</p>
            <Link to={ROUTES.contact} className="u-link mt-2 text-sm text-canvas/85">
              Use the enquiry form
            </Link>
          </li>
        </ul>
      </PageHero>

      <SectionIntro
        id="booking"
        index="01"
        label="Booking"
        heading="Choose a time."
        support="The times below come from our live calendar in your own timezone. Confirming one creates a real reservation — it cannot be taken twice."
        rule
        className="pt-12 pb-20 lg:pt-16 lg:pb-28"
      >
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 lg:mt-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-10">
              <p className="u-eyebrow">{SCHEDULE_COPY.stepsLabel}</p>
              <ol className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-3">
                {SCHEDULE_COPY.steps.map((step, index) => (
                  <li key={step} className="bg-canvas px-5 py-5">
                    <span className="u-eyebrow tabular-nums text-muted-strong">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-strong">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border border-line bg-canvas p-5 sm:p-8 lg:p-10">
              <NativeScheduler />
            </div>
          </div>

          <aside className="lg:col-span-3 lg:col-start-10">
            <div className="lg:sticky lg:top-32">
              <h3 className="u-eyebrow flex items-center gap-2">
                <CalendarDays aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                {SCHEDULE_COPY.fieldsLabel}
              </h3>

              <ul className="mt-6 border-t border-line">
                {SCHEDULE_COPY.fields.map((item) => (
                  <li
                    key={item}
                    className="flex gap-5 border-b border-line py-4 text-[0.9375rem] leading-relaxed text-muted-strong"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.55rem] h-[6px] w-[6px] shrink-0 bg-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="u-eyebrow mt-12 flex items-center gap-2">
                <Mail aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                {SCHEDULE_COPY.afterLabel}
              </h3>

              <ul className="mt-6 border-t border-line">
                {SCHEDULE_COPY.after.map((item) => (
                  <li
                    key={item}
                    className="flex gap-5 border-b border-line py-4 text-[0.9375rem] leading-relaxed text-muted-strong"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.55rem] h-[6px] w-[6px] shrink-0 bg-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="u-eyebrow mt-12 flex items-center gap-2">
                <Globe2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                Timezones
              </h3>
              <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-strong">
                Every time is shown in the timezone you choose. The booking is stored against your
                selected zone, not ours.
              </p>

              {CAL_PUBLIC_URL && (
                <a
                  href={CAL_PUBLIC_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="u-link mt-8 inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink"
                >
                  Open the calendar directly
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5" />
                </a>
              )}

              <div className="mt-10 border-t border-line pt-8">
                <Button to={ROUTES.contact} variant="outline" size="lg" icon={false}>
                  Send an enquiry instead
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </SectionIntro>
    </>
  )
}
