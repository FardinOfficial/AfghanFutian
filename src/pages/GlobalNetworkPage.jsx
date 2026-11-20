import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import ImagePlate from '@/components/ImagePlate'
import PageHero from '@/components/PageHero'
import PlainTerms from '@/components/PlainTerms'
import SectionIntro from '@/components/SectionIntro'
import { MEDIA } from '@/data/media'
import { usePages } from '@/i18n/hooks'
import { drawRule, fadeRise } from '@/animations/scrollAnimations'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * Global Network.
 *
 * "Global network" is the heading most likely to attract invented offices,
 * invented trade lanes and invented volumes, so this page refuses all three. It
 * describes the *shape* of the operation — one sourcing origin, one coordination
 * point, destinations reached per requirement — and then explains why it is a
 * diagram rather than a map.
 *
 * The closing section is the page's best idea: instead of apologising for the
 * missing map, it states exactly what would change the page. When Afghan Futian
 * confirms the markets it serves, this page becomes a real one. Until then it says
 * so, which is more credible than a decorative world map with arcs on it.
 *
 * The station rail is written here rather than shared with the homepage section,
 * because the two carry different reveals and the homepage version is already
 * verified. The markup language is identical; the choreography is local.
 */

function StationRail({ stations }) {
  const rootRef = useRef(null)

  useGSAP(
    () => {
      gsap.utils.toArray('.station-rule').forEach((rule, index) => {
        drawRule(rule, { trigger: rule, start: 'top 90%', delay: index * 0.09 })
      })

      fadeRise(gsap.utils.toArray('.station'), {
        trigger: rootRef.current,
        start: 'top 88%',
        y: 26,
        stagger: 0.1,
      })
    },
    { scope: rootRef },
  )

  return (
    <ol ref={rootRef} className="mt-16 grid grid-cols-1 lg:mt-24 lg:grid-cols-3 lg:gap-8">
      {stations.map((station) => {
        const confirmed = station.status === 'confirmed'

        return (
          <li key={station.index} className="station">
            <span
              aria-hidden="true"
              className="station-rule block h-px w-full origin-left bg-line"
            />

            <div className="flex items-center justify-between gap-4 pt-6">
              <span className="u-eyebrow tabular-nums">{station.index}</span>

              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={
                    confirmed
                      ? 'h-[7px] w-[7px] shrink-0 bg-accent'
                      : 'h-[7px] w-[7px] shrink-0 border border-line'
                  }
                />
                <span className="u-eyebrow">{station.statusLabel}</span>
              </span>
            </div>

            <h3 className="mt-8 font-display text-display-3 font-medium uppercase">{station.place}</h3>
            <p className="mt-2.5 u-eyebrow">{station.role}</p>
            <p className="mt-6 max-w-[36ch] text-sm leading-relaxed text-muted-strong">
              {station.detail}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

export default function GlobalNetworkPage() {
  const { t } = useTranslation()
  const { NETWORK_PAGE } = usePages()

  return (
    <>
      <PageHero
        index="06"
        label={t('Global Network', { ns: 'common' })}
        title={t('From Yiwu outward.', { ns: 'common' })}
        description={t(
          'See how sourcing in Yiwu, coordination through Afghan Futian and per-enquiry destinations fit together. No unverified routes are published.',
          { ns: 'common' },
        )}
        media={MEDIA.networkHero}
        meta={[
          { label: t('Sourcing base', { ns: 'common' }), value: t('Yiwu, China', { ns: 'common' }) },
          { label: t('Coordination', { ns: 'common' }), value: t('Afghan Futian', { ns: 'common' }) },
          { label: t('Markets', { ns: 'common' }), value: t('Per enquiry', { ns: 'common' }) },
          { label: t('Route data', { ns: 'common' }), value: t('Not published', { ns: 'common' }) },
        ]}
      />

      <SectionIntro id="network-shape" rule {...NETWORK_PAGE.shape}>
        <StationRail stations={NETWORK_PAGE.stations} />
      </SectionIntro>

      <SectionIntro id="network-plain-terms" tone="surface" {...NETWORK_PAGE.ledger}>
        <PlainTerms
          items={NETWORK_PAGE.ledger.items}
          tone="surface"
          columns={2}
          className="mt-16 lg:mt-20"
        />
      </SectionIntro>

      <SectionIntro id="network-future" tone="dark" {...NETWORK_PAGE.future}>
        <ImagePlate
          src={NETWORK_PAGE.future.media}
          caption={NETWORK_PAGE.future.mediaNote}
          tone="dark"
          sizes="100vw"
          aspect="aspect-[16/9]"
          className="mt-16 lg:mt-24"
        />
      </SectionIntro>
    </>
  )
}
