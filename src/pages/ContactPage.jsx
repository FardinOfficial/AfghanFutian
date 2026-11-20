import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '@/components/Button'
import Callout from '@/components/Callout'
import ContactForm from '@/components/ContactForm'
import PageHero from '@/components/PageHero'
import SectionIntro from '@/components/SectionIntro'
import SocialLinks from '@/components/SocialLinks'
import { MEDIA } from '@/data/media'
import { LocaleLink } from '@/i18n/LocaleLink'
import { useHome, useNavigation } from '@/i18n/hooks'

/**
 * Contact.
 *
 * The one page where the reader has already decided to act, so it carries no
 * closing call to action (the layout suppresses it here) and no persuasive
 * padding. The hero states the ask, the form takes it, and the aside tells the
 * reader what to include and what happens to what they send.
 *
 * The aside deliberately reuses `CLOSING_CTA.brief` rather than repeating the
 * same checklist as new copy. It is the same list, so it is the same object —
 * a second hand-maintained copy of it would eventually drift out of step with
 * the first.
 *
 * Ground rhythm: ink (hero) → canvas (form) → ink (footer), which keeps the
 * form on the brightest ground on the page and puts the accent plate of the
 * submit button where the eye finishes.
 */
export default function ContactPage() {
  const { t } = useTranslation()
  const { CLOSING_CTA } = useHome()
  const { CONTACT_DETAILS, ROUTES } = useNavigation()

  return (
    <>
      <PageHero
        index="07"
        label={t('Contact', { ns: 'common' })}
        title={t('Start a conversation.', { ns: 'common' })}
        description={t(
          'Have a sourcing requirement or an international business opportunity? Tell us what you need and we will respond.',
          { ns: 'common' },
        )}
        media={MEDIA.contactHero}
      >
        <ul className="mt-9 space-y-5 border-t border-line-invert pt-7">
          <li>
            <p className="u-eyebrow text-canvas-muted">{t('Email', { ns: 'common' })}</p>
            <a href={CONTACT_DETAILS.emailHref} className="u-link mt-2 text-sm text-canvas/85">
              {CONTACT_DETAILS.email}
            </a>
          </li>
          <li>
            <p className="u-eyebrow text-canvas-muted">{t('Telephone', { ns: 'common' })}</p>
            <ul className="mt-2 space-y-2">
              {CONTACT_DETAILS.phones.map((phone) => (
                <li key={phone.id}>
                  <a href={phone.href} className="u-link text-sm text-canvas/85">
                    <span className="mr-2 text-canvas-muted rtl:mr-0 rtl:ml-2">{phone.label}</span>
                    {phone.display}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <p className="u-eyebrow text-canvas-muted">{t('Prefer to talk', { ns: 'common' })}</p>
            <LocaleLink to={ROUTES.schedule} className="u-link mt-2 text-sm text-canvas/85">
              {t('Schedule a meeting', { ns: 'common' })}
            </LocaleLink>
          </li>
          <li>
            <p className="u-eyebrow text-canvas-muted">{t('Elsewhere', { ns: 'common' })}</p>
            <SocialLinks tone="dark" className="mt-3" />
          </li>
        </ul>
      </PageHero>

      <SectionIntro
        id="contact-inquiry"
        index="01"
        label={t('Business Inquiry', { ns: 'common' })}
        heading={t('Tell us what you need moved.', { ns: 'common' })}
        support={t(
          'A requirement is easier to answer than an introduction. The more of the shape you can give us — product, quantity, destination, timeline — the more useful the first reply will be.',
          { ns: 'common' },
        )}
        rule
      >
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 lg:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="lg:sticky lg:top-32">
              <h3 className="u-eyebrow">{CLOSING_CTA.brief.label}</h3>

              <ul className="mt-6 border-t border-line">
                {CLOSING_CTA.brief.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-5 border-b border-line py-4 text-[0.9375rem] leading-relaxed text-muted-strong"
                  >
                    <span aria-hidden="true" className="mt-[0.55rem] h-[6px] w-[6px] shrink-0 bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Callout label={t('If you would rather write', { ns: 'common' })} className="mt-12">
                {t('Email', { ns: 'common' })}{' '}
                <a href={CONTACT_DETAILS.emailHref} className="u-link text-ink">
                  {CONTACT_DETAILS.email}
                </a>{' '}
                {t('directly, or call our China number', { ns: 'common' })}{' '}
                <a href={CONTACT_DETAILS.phones[0].href} className="u-link text-ink">
                  {CONTACT_DETAILS.phones[0].display}
                </a>{' '}
                {t('or our Afghanistan number', { ns: 'common' })}{' '}
                <a href={CONTACT_DETAILS.phones[1].href} className="u-link text-ink">
                  {CONTACT_DETAILS.phones[1].display}
                </a>
                {t('. All three reach the same team as this form.', { ns: 'common' })}
              </Callout>

              <div className="mt-8 border-t border-line pt-8">
                <h3 className="u-eyebrow">{t('Prefer to talk it through', { ns: 'common' })}</h3>
                <p className="mt-4 max-w-[42ch] text-[0.9375rem] leading-relaxed text-muted-strong">
                  {t(
                    'Choose a time that suits you and we will confirm it by email. The calendar shows the times that are genuinely open.',
                    { ns: 'common' },
                  )}
                </p>
                <div className="mt-6">
                  <Button to={ROUTES.schedule} variant="outline" size="lg" icon={false}>
                    {t('Schedule a Meeting', { ns: 'common' })}
                  </Button>
                </div>
              </div>

              <Callout label={t('About these details', { ns: 'common' })} className="mt-8">
                {t(
                  'We use what you send only to answer your enquiry. Nothing here is added to a mailing list, and no figure is quoted until we have a real requirement to quote against.',
                  { ns: 'common' },
                )}
              </Callout>
            </div>
          </aside>
        </div>

        <div className="mt-20 border-t border-line pt-12 lg:mt-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="u-eyebrow">{t('Where we are', { ns: 'common' })}</p>
              <h3 className="mt-4 font-display text-display-3 font-medium">
                {t('Three locations. One team.', { ns: 'common' })}
              </h3>
            </div>
            <p className="max-w-[38ch] text-sm leading-relaxed text-muted-strong">
              {t(
                'Our sourcing work starts in China and our Afghanistan presence spans Kabul and Mandawi. Each address opens an area search — no unverified map pin is published.',
                { ns: 'common' },
              )}
            </p>
          </div>

          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-3">
            {CONTACT_DETAILS.locations.map((location) => (
              <article key={location.id} className="flex min-h-[13rem] flex-col bg-canvas p-6">
                <p className="u-eyebrow">{location.label}</p>
                <p className="mt-6 text-[0.9375rem] leading-relaxed text-muted-strong">
                  {location.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <a
                  href={location.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="u-link mt-auto pt-8 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink"
                >
                  {t('Search the area', { ns: 'common' })}
                  <ArrowUpRight
                    aria-hidden="true"
                    strokeWidth={1.6}
                    className="h-3.5 w-3.5 rtl:-scale-x-100"
                  />
                </a>
              </article>
            ))}
          </div>
        </div>
      </SectionIntro>
    </>
  )
}
