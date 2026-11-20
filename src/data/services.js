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
    title: 'Product sourcing',
    short: 'Sourcing',
    summary: 'Product and supplier sourcing in Yiwu, China.',
    description:
      'We clarify the specification, identify suppliers in China and coordinate the conversation until a supplier and price can be assessed.',
    media: MEDIA.capabilitySourcing,
    to: ROUTES.sourcing,
  },
  {
    id: 'trade',
    index: '02',
    title: 'Trade coordination',
    short: 'Trade',
    summary: 'Linking Chinese suppliers with buyer markets.',
    description:
      'We align the buyer’s requirement with supplier terms and the export documents needed to move the order forward.',
    media: MEDIA.capabilityTrade,
    to: ROUTES.sourcing,
  },
  {
    id: 'supply-chain',
    index: '03',
    title: 'Supply Chain',
    short: 'Supply Chain',
    summary: 'Coordination from order confirmation to export.',
    description:
      'One contact tracks production dates, order details, documents and handover so the buyer is not left reconciling separate updates.',
    media: MEDIA.capabilitySupplyChain,
    to: ROUTES.supplyChain,
  },
  {
    id: 'logistics',
    index: '04',
    title: 'Logistics',
    short: 'Logistics',
    summary: 'Cargo coordination with logistics partners.',
    description:
      'We arrange transport through logistics partners, choose the service to suit the cargo and destination, and report progress until arrival.',
    media: MEDIA.capabilityLogistics,
    to: ROUTES.logistics,
  },
]

/** The five-step engagement process. */
export const PROCESS_STEPS = [
  {
    id: 'understand',
    index: '01',
    title: 'Define the Requirement',
    description:
      'We record the product, specification, quantity, target price, packaging and destination before approaching suppliers.',
    media: MEDIA.processRequirement,
    meta: 'Product · Quantity · Destination',
  },
  {
    id: 'source',
    index: '02',
    title: 'Search Suppliers in China',
    description:
      'From our Yiwu base, we identify suppliers whose stated capability matches the confirmed brief.',
    media: MEDIA.processSourcing,
    meta: 'Yiwu · Supplier search · Samples',
  },
  {
    id: 'coordinate',
    index: '03',
    title: 'Agree the Order',
    description:
      'We coordinate supplier communication, order details and production timelines, and report changes as soon as they are known.',
    media: MEDIA.processSupplyChain,
    meta: 'Supplier · Timeline · Documents',
  },
  {
    id: 'export',
    index: '04',
    title: 'Prepare Export & Cargo',
    description:
      'We coordinate export documents and work with logistics partners to match the service to the cargo and destination.',
    media: MEDIA.processExport,
    meta: 'Documents · Partner booking · Cargo',
  },
  {
    id: 'delivery',
    index: '05',
    title: 'Follow the Shipment',
    description:
      'We track movement and keep the buyer informed until the goods reach the agreed destination.',
    media: MEDIA.processDelivery,
    meta: 'Tracking · Updates · Arrival',
  },
]

/**
 * "Why Afghan Futian" — statements about *approach*.
 * Deliberately free of performance claims, because none have been verified.
 */
export const DIFFERENTIATORS = [
  {
    index: '01',
    title: 'Based in Yiwu',
    body: 'Our China base is in Yiwu, where supplier research and export preparation begin.',
  },
  {
    index: '02',
    title: 'One point of contact',
    body: 'The buyer works with Afghan Futian across sourcing, documents and cargo instead of coordinating each stage separately.',
  },
  {
    index: '03',
    title: 'Clear brief before quotation',
    body: 'We confirm specification, quantity and destination before asking suppliers to price.',
  },
  {
    index: '04',
    title: 'Planned to the destination',
    body: 'Transport and export steps are arranged around where the goods must arrive.',
  },
]

/** Company values, used on the About page. */
export const VALUES = [
  {
    index: '01',
    title: 'Clarity',
    body: 'Clear specifications, documents and updates from the first brief to arrival.',
  },
  {
    index: '02',
    title: 'Reliability',
    body: 'We report agreed dates and flag changes as soon as we know them.',
  },
  {
    index: '03',
    title: 'Continuity',
    body: 'We keep the same point of contact and working method from one requirement to the next.',
  },
  {
    index: '04',
    title: 'Responsibility',
    body: 'We describe only the work we can arrange and say when a request falls outside it.',
  },
]

/** Service options for the contact form's "service of interest" select.
    Re-exported from its own leaf module so `api/contact.js` can import it
    without pulling in the rest of this file's content graph. */
export { SERVICE_OPTIONS } from './serviceOptions'
