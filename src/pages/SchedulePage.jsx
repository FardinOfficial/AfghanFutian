import { Link } from 'react-router-dom'

import Button from '@/components/Button'
import PageHero from '@/components/PageHero'
import ScheduleEmbed from '@/components/ScheduleEmbed'
import SectionIntro from '@/components/SectionIntro'
import { CONTACT_DETAILS, ROUTES } from '@/data/navigation'
import {
  CAL_EMBED_URL,
  CAL_PUBLIC_URL,
  IS_SCHEDULING_CONFIGURED,
  SCHEDULE_COPY,
} from '@/data/scheduling'

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
 * The booking surface itself is Cal.com, embedded in an iframe. See
 * `src/data/scheduling.js` for the integration notes and
 * `src/components/ScheduleEmbed.jsx` for the frame.
 *
 * When no calendar is connected the page does not pretend otherwise: it says so,
 * and it offers the enquiry form and the contact address instead.
 */
export default function SchedulePage() {
  const configured = IS_SCHEDULING_CONFIGURED

  return (
    <>
      <PageHero
        index="08"
        label={SCHEDULE_COPY.label}
        title={SCHEDULE_COPY.heading}
        description={SCHEDULE_COPY.support}
      >
        <ul className="mt-9 space-y-5 border-t border-line-invert pt-7">
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
        label={configured ? 'Booking' : SCHEDULE_COPY.unconfigured.label}
        heading={configured ? 'Choose a time.' : SCHEDULE_COPY.unconfigured.heading}
        support={
          configured
            ? 'The times shown are the ones genuinely open in the calendar, in your own timezone. Booking one confirms it immediately — it cannot be taken twice.'
            : SCHEDULE_COPY.unconfigured.body
        }
        rule
      >
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 lg:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {configured ? (
              <ScheduleEmbed url={CAL_EMBED_URL} publicUrl={CAL_PUBLIC_URL} />
            ) : (
              <div className="border-t border-line pt-10">
                <div className="flex flex-wrap items-center gap-3">
                  <Button to={ROUTES.contact} variant="accent" size="lg">
                    Send an enquiry
                  </Button>
                  <Button href={CONTACT_DETAILS.emailHref} variant="outline" size="lg" icon={false}>
                    Email us instead
                  </Button>
                </div>

                <p className="mt-8 max-w-[52ch] text-[0.8125rem] leading-relaxed text-muted-strong">
                  {SCHEDULE_COPY.unconfigured.note}
                </p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-3 lg:col-start-10">
            <div className="lg:sticky lg:top-32">
              <h3 className="u-eyebrow">{SCHEDULE_COPY.fieldsLabel}</h3>

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

              <h3 className="u-eyebrow mt-12">{SCHEDULE_COPY.afterLabel}</h3>

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
            </div>
          </aside>
        </div>
      </SectionIntro>
    </>
  )
}
