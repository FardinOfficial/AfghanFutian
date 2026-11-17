import ImagePlate from '@/components/ImagePlate'
import IndexGrid from '@/components/IndexGrid'
import NextStep from '@/components/NextStep'
import PageHero from '@/components/PageHero'
import PlainTerms from '@/components/PlainTerms'
import SectionIntro from '@/components/SectionIntro'
import { MEDIA } from '@/data/media'
import { LOGISTICS } from '@/data/pages'

/**
 * Logistics.
 *
 * The page where a logistics company is most tempted to imply a fleet, so this
 * one states the opposite in its first paragraph and repeats it in a dedicated
 * block: Afghan Futian does not own vessels, aircraft, warehouses or fleets.
 *
 * What it does do is the four interlocking decisions that actually constitute
 * arranging movement — destination, mode, export formalities, and communication —
 * taken together rather than in isolation, because taken separately is how
 * shipments end up expensive or late.
 *
 * The "what we do not own" block runs on ink. It is the one section on the page
 * that has to land hardest, and it also keeps the tail of the page from
 * flattening into two light grounds in a row before the next-step block.
 *
 * Ground rhythm: ink (hero) → canvas → surface → ink (what we do not own) →
 * canvas (next step) → ink (CTA).
 */
export default function Logistics() {
  return (
    <>
      <PageHero
        index="05"
        label="Logistics"
        title="Movement, arranged around the destination."
        description="International cargo and transportation coordination, planned with logistics partners and matched to where the goods must land."
        media={MEDIA.logisticsHero}
        meta={[
          { label: 'Mode', value: 'To be confirmed' },
          { label: 'Ownership', value: 'Partner-operated' },
          { label: 'Planning', value: 'Destination-led' },
          { label: 'Tracking', value: 'Supported' },
        ]}
      />

      <SectionIntro id="logistics-overview" rule {...LOGISTICS.overview} />

      <SectionIntro id="logistics-arrangement" tone="surface" {...LOGISTICS.arrangement}>
        <IndexGrid
          items={LOGISTICS.arrangement.items}
          tone="surface"
          columns={2}
          className="mt-16 lg:mt-24"
        />

        <ImagePlate
          src={LOGISTICS.arrangement.media}
          caption={LOGISTICS.arrangement.mediaNote}
          sizes="100vw"
          aspect="aspect-[16/10]"
          className="mt-16 lg:mt-24"
        />
      </SectionIntro>

      <SectionIntro id="logistics-limits" tone="dark" {...LOGISTICS.limits}>
        <PlainTerms
          items={LOGISTICS.limits.items}
          tone="dark"
          columns={3}
          className="mt-16 lg:mt-20"
        />
      </SectionIntro>

      <NextStep {...LOGISTICS.next} />
    </>
  )
}
