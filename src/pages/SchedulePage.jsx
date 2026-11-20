import { useTranslation } from 'react-i18next'

import Button from '@/components/Button'
import PageHero from '@/components/PageHero'
import ScheduleEmbed from '@/components/ScheduleEmbed'
import SectionIntro from '@/components/SectionIntro'
import { LocaleLink } from '@/i18n/LocaleLink'
import { useNavigation, useScheduling } from '@/i18n/hooks'
// Machine value, not copy: the embed URL is injected into the iframe verbatim.
// All human-facing scheduling copy comes from useScheduling() below.
import { CAL_EMBED_URL } from '@/data/scheduling'

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
 *   • No custom booker. Cal.com's official iframe owns the calendar, slots,
 *     details form, confirmation, Google Meet link, and reschedule/cancel flow.
 *
 * The global navbar and footer are untouched. `PageHero` carries the existing
 * `data-nav-sentinel` and its own top padding, so the booking surface sits below
 * the fixed navbar at every breakpoint.
 */
export default function SchedulePage() {
  const { t } = useTranslation()
  const { CONTACT_DETAILS, ROUTES } = useNavigation()
  const {
    copy,
    CAL_PUBLIC_URL,
    IS_SCHEDULING_CONFIGURED,
    fallbackEmail,
    zoneLabel,
  } = useScheduling()
  const configured = IS_SCHEDULING_CONFIGURED

  return (
    <>
      <PageHero
        index="08"
        label={copy.label}
        title={copy.heading}
        description={copy.support}
      >
        <ul className="mt-9 space-y-5 border-t border-line-invert pt-7">
          <li>
            <p className="u-eyebrow text-canvas-muted">{t('Prefer to write', { ns: 'common' })}</p>
            <a href={CONTACT_DETAILS.emailHref} className="u-link mt-2 text-sm text-canvas/85">
              {fallbackEmail}
            </a>
          </li>
          <li>
            <p className="u-eyebrow text-canvas-muted">
              {t('Have a detailed requirement', { ns: 'common' })}
            </p>
            <LocaleLink to={ROUTES.contact} className="u-link mt-2 text-sm text-canvas/85">
              {t('Use the enquiry form', { ns: 'common' })}
            </LocaleLink>
          </li>
        </ul>
      </PageHero>

      <SectionIntro
        id="booking"
        index="01"
        label={configured ? t('Booking', { ns: 'common' }) : copy.unconfigured.label}
        heading={configured ? t('Choose a time.', { ns: 'common' }) : copy.unconfigured.heading}
        support={
          configured
            ? t(
                'The official calendar below shows only times genuinely open in our Cal.com schedule. It opens in Kabul time and you can switch timezone inside the booker.',
                { ns: 'common' },
              )
            : copy.unconfigured.body
        }
        rule
        className="pt-12 pb-20 lg:pt-16 lg:pb-28"
      >
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 lg:mt-16 lg:grid-cols-12">
          <div className="lg:col-span-8" dir="ltr">
            {configured ? (
              <>
                <div className="mb-8">
                  <p className="u-eyebrow">{copy.stepsLabel}</p>
                  <ol className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-3">
                    {copy.steps.map((step, index) => (
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
                <ScheduleEmbed url={CAL_EMBED_URL} publicUrl={CAL_PUBLIC_URL} />
              </>
            ) : (
              <div className="border-t border-line pt-10">
                <div className="flex flex-wrap items-center gap-3">
                  <Button to={ROUTES.contact} variant="accent" size="lg">
                    {t('Send an enquiry', { ns: 'common' })}
                  </Button>
                  <Button href={CONTACT_DETAILS.emailHref} variant="outline" size="lg" icon={false}>
                    {t('Email us instead', { ns: 'common' })}
                  </Button>
                </div>

                <p className="mt-8 max-w-[52ch] text-[0.8125rem] leading-relaxed text-muted-strong">
                  {copy.unconfigured.note}
                </p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-3 lg:col-start-10">
            <div className="lg:sticky lg:top-32">
              <h3 className="u-eyebrow">{copy.fieldsLabel}</h3>

              <ul className="mt-6 border-t border-line">
                {copy.fields.map((item) => (
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

              <h3 className="u-eyebrow mt-12">{copy.afterLabel}</h3>

              <ul className="mt-6 border-t border-line">
                {copy.after.map((item) => (
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

              <p className="mt-8 text-[0.8125rem] leading-relaxed text-muted-strong">
                {t('Default timezone:', { ns: 'common' })}{' '}
                <strong className="font-medium text-ink">{zoneLabel}</strong>{' '}
                (GMT+04:30). {t('Change it with the selector inside the calendar.', { ns: 'common' })}
              </p>
            </div>
          </aside>
        </div>
      </SectionIntro>
    </>
  )
}
