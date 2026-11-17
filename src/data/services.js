import { MEDIA } from './media'
import { ROUTES } from './navigation'

/**
 * Service content model.
 *
 * Editorial rules applied throughout this file:
 *  - No invented statistics, certifications, office counts or route claims.
 *  - Descriptions state what Afghan Futian *does*, not what it *owns*.
 *  - Anything awaiting confirmation is marked with `pending: true` and rendered
 *    by the UI as a clearly-labelled placeholder.
 */

/** The four core capabilities. Numbering is editorial, not a ranking. */
export const CAPABILITIES = [
  {
    id: 'sourcing',
    index: '01',
    title: 'Global Sourcing',
    short: 'Sourcing',
    summary: 'Product and supplier sourcing in China.',
    description:
      'We work from the buyer’s requirement backwards: clarifying specification, identifying suitable suppliers in China, and coordinating the conversation between both sides.',
    media: MEDIA.capabilitySourcing,
    to: ROUTES.sourcing,
  },
  {
    id: 'trade',
    index: '02',
    title: 'International Trade',
    short: 'Trade',
    summary: 'Connecting sourcing operations with worldwide markets.',
    description:
      'We sit between production and demand — aligning a confirmed requirement with the right supplier, the right terms and a workable export arrangement.',
    media: MEDIA.capabilityTrade,
    to: ROUTES.sourcing,
  },
  {
    id: 'supply-chain',
    index: '03',
    title: 'Supply Chain',
    short: 'Supply Chain',
    summary: 'Coordinating supply chain operations.',
    description:
      'A single point of coordination across sourcing, production timelines, documentation and handover, so nothing is lost between one stage and the next.',
    media: MEDIA.capabilitySupplyChain,
    to: ROUTES.supplyChain,
  },
  {
    id: 'logistics',
    index: '04',
    title: 'Logistics',
    short: 'Logistics',
    summary: 'International cargo and transportation coordination.',
    description:
      'We arrange and coordinate the movement of goods — selecting transportation modes with our logistics partners and keeping the buyer informed at every stage.',
    media: MEDIA.capabilityLogistics,
    to: ROUTES.logistics,
  },
]

/** The five-step engagement process. */
export const PROCESS_STEPS = [
  {
    id: 'understand',
    index: '01',
    title: 'Understand Requirements',
    description:
      'We start with the details that decide everything downstream: product specification, quantities, target pricing, destination and timeline.',
    media: MEDIA.processRequirement,
    meta: 'Brief · Specification · Destination',
  },
  {
    id: 'source',
    index: '02',
    title: 'Source in China',
    description:
      'Using our position within China’s supplier landscape, we identify and approach suppliers whose capabilities match the confirmed requirement.',
    media: MEDIA.processSourcing,
    meta: 'Supplier outreach · Samples · Quotation',
  },
  {
    id: 'coordinate',
    index: '03',
    title: 'Coordinate the Supply Chain',
    description:
      'Once a direction is agreed, we coordinate production timelines, order details and documentation between supplier and buyer.',
    media: MEDIA.processSupplyChain,
    meta: 'Timelines · Documentation · Order details',
  },
  {
    id: 'export',
    index: '04',
    title: 'Arrange Export & Transportation',
    description:
      'We coordinate the export formalities and arrange transportation, working with logistics partners to match mode and schedule to the destination.',
    media: MEDIA.processExport,
    meta: 'Export · Freight coordination · Mode selection',
  },
  {
    id: 'delivery',
    index: '05',
    title: 'Support Global Delivery',
    description:
      'Shipment tracking and communication continue until goods reach the destination, and we remain available for what comes next.',
    media: MEDIA.processDelivery,
    meta: 'Tracking · Communication · Follow-up',
  },
]

/**
 * "Why Afghan Futian" — statements about *approach*.
 * Deliberately free of performance claims, because none have been verified.
 */
export const DIFFERENTIATORS = [
  {
    index: '01',
    title: 'Grounded in China’s supply base',
    body: 'Sourcing is our starting point, not an add-on. We work where the suppliers are.',
  },
  {
    index: '02',
    title: 'One coordinated conversation',
    body: 'Buyers deal with us, not with a chain of intermediaries across two continents.',
  },
  {
    index: '03',
    title: 'Requirements before quotations',
    body: 'We would rather ask the difficult questions early than correct them later.',
  },
  {
    index: '04',
    title: 'Built around the destination',
    body: 'Transportation and export arrangements are planned around where goods must land.',
  },
]

/** Company values, used on the About page. */
export const VALUES = [
  {
    index: '01',
    title: 'Clarity',
    body: 'Clear specifications, clear timelines, clear communication — the foundation of every successful shipment.',
  },
  {
    index: '02',
    title: 'Reliability',
    body: 'We follow through on what we commit to, and we say so early when something changes.',
  },
  {
    index: '03',
    title: 'Partnership',
    body: 'We treat suppliers and buyers as long-term relationships rather than one-off transactions.',
  },
  {
    index: '04',
    title: 'Responsibility',
    body: 'We only represent capabilities we can genuinely deliver, and we are candid about the rest.',
  },
]

/** Service options for the contact form's "service of interest" select. */
export const SERVICE_OPTIONS = [
  'Global Sourcing',
  'International Trade',
  'Supply Chain Coordination',
  'Logistics & Transportation',
  'General Enquiry',
]
