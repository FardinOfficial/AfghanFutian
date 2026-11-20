import { useTranslation } from 'react-i18next'

import ImagePlate from '@/components/ImagePlate'
import NextStep from '@/components/NextStep'
import PageHero from '@/components/PageHero'
import PlainTerms from '@/components/PlainTerms'
import SectionIntro from '@/components/SectionIntro'
import SectionRail from '@/components/SectionRail'
import { MEDIA } from '@/data/media'
import { usePages } from '@/i18n/hooks'

/**
 * Supply Chain.
 *
 * The least visible part of the operation and the one most likely to go wrong, so
 * the page names the four things that actually move between a supplier and a
 * buyer — timelines, order details, documentation and handover — rather than
 * describing coordination in the abstract.
 *
 * The argument of the page is one sentence: when these four sit with four
 * different companies, the buyer becomes the integration layer. Holding them in
 * one place does not remove the gaps in international trade; it means there is one
 * party responsible for noticing them.
 *
 * This page is the one that carries the thread, so it is the one that uses the
 * rail: the four coordinated things are strung on a single drawn line rather than
 * set out as four parallel cells. It is also the only service page whose
 * mid-page statement runs on ink, which is what stops the three service pages
 * reading as the same template with different words.
 *
 * Ground rhythm: ink (hero) → canvas → surface (rail) → ink (single point) →
 * surface → canvas (next step) → ink (CTA).
 */
export default function SupplyChain() {
  const { t } = useTranslation()
  const { SUPPLY_CHAIN } = usePages()

  return (
    <>
      <PageHero
        index="04"
        label={t('Supply Chain', { ns: 'common' })}
        title={t('One thread from requirement to export.', { ns: 'common' })}
        description={t(
          'Coordination across sourcing, production timelines, documentation and handover — so nothing is lost between one stage and the next.',
          { ns: 'common' },
        )}
        media={MEDIA.supplyChainHero}
        meta={[
          { label: t('Scope', { ns: 'common' }), value: t('Sourcing to export', { ns: 'common' }) },
          { label: t('Coordination', { ns: 'common' }), value: t('Single point', { ns: 'common' }) },
          { label: t('Assets', { ns: 'common' }), value: t('Partner-operated', { ns: 'common' }) },
          { label: t('Status', { ns: 'common' }), value: t('Details pending', { ns: 'common' }) },
        ]}
      />

      <SectionIntro id="supply-chain-overview" rule {...SUPPLY_CHAIN.overview} />

      <SectionIntro id="supply-chain-thread" tone="surface" {...SUPPLY_CHAIN.thread}>
        <SectionRail items={SUPPLY_CHAIN.thread.items} tone="surface" className="mt-16 lg:mt-24" />
      </SectionIntro>

      <SectionIntro id="supply-chain-single-point" tone="dark" {...SUPPLY_CHAIN.singlePoint}>
        <ImagePlate
          src={SUPPLY_CHAIN.singlePoint.media}
          caption={SUPPLY_CHAIN.singlePoint.mediaNote}
          tone="dark"
          sizes="100vw"
          aspect="aspect-[3/2]"
          className="mt-16 lg:mt-24"
        />
      </SectionIntro>

      <SectionIntro id="supply-chain-limits" tone="surface" {...SUPPLY_CHAIN.limits}>
        <PlainTerms
          items={SUPPLY_CHAIN.limits.items}
          tone="surface"
          columns={3}
          className="mt-16 lg:mt-20"
        />
      </SectionIntro>

      <NextStep {...SUPPLY_CHAIN.next} />
    </>
  )
}
