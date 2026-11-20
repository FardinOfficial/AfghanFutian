import { useTranslation } from 'react-i18next'

import Callout from '@/components/Callout'
import ImagePlate from '@/components/ImagePlate'
import IndexGrid from '@/components/IndexGrid'
import NextStep from '@/components/NextStep'
import PageHero from '@/components/PageHero'
import PlainTerms from '@/components/PlainTerms'
import SectionIntro from '@/components/SectionIntro'
import { MEDIA } from '@/data/media'
import { usePages } from '@/i18n/hooks'

/**
 * Global Sourcing.
 *
 * Sourcing is sold almost everywhere with the same promises attached — verified
 * factories, audited suppliers, guaranteed quality. Afghan Futian has confirmed
 * none of those, so this page describes the sequence instead, and ends by stating
 * plainly what the service is not.
 *
 * The "what we need from you" list is the most useful thing on the page: it is the
 * difference between an enquiry that reaches a decision in one exchange and one
 * that takes several.
 */
export default function Sourcing() {
  const { t } = useTranslation()
  const { SOURCING } = usePages()

  return (
    <>
      <PageHero
        index="03"
        label={t('Global Sourcing', { ns: 'common' })}
        title={t('We start where the suppliers are.', { ns: 'common' })}
        description={t(
          "Product and supplier sourcing in China, coordinated from the buyer's requirement through to a confirmed arrangement.",
          { ns: 'common' },
        )}
        media={MEDIA.sourcingHero}
        meta={[
          { label: t('Origin', { ns: 'common' }), value: t('China', { ns: 'common' }) },
          { label: t('Input', { ns: 'common' }), value: t('Buyer requirement', { ns: 'common' }) },
          { label: t('Output', { ns: 'common' }), value: t('Confirmed sourcing', { ns: 'common' }) },
          { label: t('Verification', { ns: 'common' }), value: t('Not claimed', { ns: 'common' }) },
        ]}
      />

      <SectionIntro id="sourcing-overview" rule {...SOURCING.overview} />

      <SectionIntro id="sourcing-sequence" tone="surface" {...SOURCING.sequence}>
        <IndexGrid
          items={SOURCING.sequence.items}
          tone="surface"
          columns={2}
          className="mt-16 lg:mt-24"
        />

        <ImagePlate
          src={SOURCING.sequence.media}
          caption={SOURCING.sequence.mediaNote}
          sizes="100vw"
          aspect="aspect-[16/9]"
          className="mt-16 lg:mt-24"
        />
      </SectionIntro>

      <SectionIntro id="sourcing-brief" {...SOURCING.brief}>
        <ul className="mt-16 max-w-[62ch] border-t border-line lg:mt-20">
          {SOURCING.brief.items.map((item) => (
            <li key={item} className="flex gap-5 border-b border-line py-5">
              <span aria-hidden="true" className="mt-[0.55rem] h-[6px] w-[6px] shrink-0 bg-accent" />
              <span className="text-[0.9375rem] leading-relaxed text-muted-strong">{item}</span>
            </li>
          ))}
        </ul>

        <Callout className="mt-10 max-w-[54ch]">{SOURCING.brief.note}</Callout>
      </SectionIntro>

      <SectionIntro id="sourcing-limits" tone="surface" {...SOURCING.limits}>
        <PlainTerms
          items={SOURCING.limits.items}
          tone="surface"
          columns={3}
          className="mt-16 lg:mt-20"
        />
      </SectionIntro>

      <NextStep {...SOURCING.next} />
    </>
  )
}
