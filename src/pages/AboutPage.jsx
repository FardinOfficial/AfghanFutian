import Callout from '@/components/Callout'
import ImagePlate from '@/components/ImagePlate'
import IndexGrid from '@/components/IndexGrid'
import NextStep from '@/components/NextStep'
import PageHero from '@/components/PageHero'
import PlainTerms from '@/components/PlainTerms'
import SectionIntro from '@/components/SectionIntro'
import { MEDIA } from '@/data/media'
import { ABOUT } from '@/data/pages'
import { VALUES } from '@/data/services'

/**
 * About Us.
 *
 * The page a company usually fills with a founding story, a headcount and a
 * mission statement. Afghan Futian has none of those confirmed, so this page
 * does something more useful: it explains the operating model, states the four
 * claims it deliberately does not make, and holds the values that govern how a
 * requirement is handled.
 *
 * That structure is not a compromise. A company page that says what it will not
 * claim is more persuasive than one that says everything, and it is the only
 * honest option available here.
 *
 * Ground rhythm: ink (hero) → canvas → surface → canvas → surface → ink (CTA).
 * Alternating the two light grounds keeps the page legible without introducing a
 * third colour.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero
        index="02"
        label="About Us"
        title="Trade is more than movement."
        description="Afghan Futian is an international sourcing, trading and supply chain company working between China's supplier base and buyers around the world."
        media={MEDIA.aboutHero}
        meta={[
          { label: 'Based in', value: 'China sourcing origin' },
          { label: 'Focus', value: 'Sourcing & supply chain' },
          { label: 'Reach', value: 'Worldwide buyers' },
          { label: 'Status', value: 'Details pending' },
        ]}
      />

      <SectionIntro id="about-company" rule {...ABOUT.who} />

      <SectionIntro id="about-model" tone="surface" {...ABOUT.model}>
        <IndexGrid
          items={ABOUT.model.items}
          tone="surface"
          columns={3}
          className="mt-16 lg:mt-24"
        />

        <ImagePlate
          src={ABOUT.model.media}
          caption={ABOUT.model.mediaNote}
          sizes="100vw"
          aspect="aspect-[21/9]"
          className="mt-16 lg:mt-24"
        />
      </SectionIntro>

      <SectionIntro id="about-plain-terms" {...ABOUT.ledger}>
        <PlainTerms
          items={ABOUT.ledger.items}
          columns={2}
          className="mt-16 lg:mt-20"
        />
      </SectionIntro>

      <SectionIntro id="about-values" tone="surface" {...ABOUT.values}>
        <IndexGrid items={VALUES} tone="surface" columns={4} className="mt-16 lg:mt-20" />

        <Callout label={ABOUT.team.label} className="mt-16 max-w-[52ch]">
          {ABOUT.team.body}
        </Callout>
      </SectionIntro>

      <NextStep {...ABOUT.next} />
    </>
  )
}
