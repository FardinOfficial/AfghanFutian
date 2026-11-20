import { MEDIA } from './media'
import { ROUTES } from './navigation'

/**
 * INNER PAGE CONTENT MODEL
 * ============================================================================
 * Copy for the six inner routes, kept out of the components for the same reason
 * as `home.js`: prose should be revisable without touching layout or animation.
 *
 * Editorial rules (identical to `home.js` and `services.js`)
 * ----------------------------------------------------------------------------
 *  • No invented history, founding dates, employee counts, offices, markets,
 *    certifications, client numbers, partners, routes, volumes or owned assets.
 *  • Every statement describes *how the operation works*. Method is authorable;
 *    facts about the company are not, until Afghan Futian supplies them.
 *  • Where a page would naturally assert a fact we do not have, it says so
 *    explicitly instead of filling the gap with plausible-sounding language.
 *    That candour is the house style, not a placeholder.
 *
 * The `ledger` blocks are the clearest expression of that rule: each one pairs
 * "what this is" with "what this is not", so a reader never has to guess which
 * claims are backed.
 */

/* ============================================================================
   ABOUT US
   ========================================================================= */

export const ABOUT = {
  who: {
    index: '01',
    label: 'The Company',
    heading: 'From supplier to destination.',
    support: 'Afghan Futian is a trading company working between China’s supplier base and buyers in Afghanistan and other markets. We handle each requirement from the first brief through sourcing, documentation and movement.',
    body: 'A buyer brings us a product and destination. We clarify the specification, identify suppliers in China and coordinate the steps that take the order through production, export and cargo movement.',
  },

  model: {
    index: '02',
    label: 'How We Work',
    heading: 'One coordinated workflow.',
    support:
      'Sourcing, coordination and movement are often handled by separate parties. Afghan Futian holds the thread across all three so the buyer works from one set of dates, documents and updates.',
    items: [
      {
        index: '01',
        title: 'Sourcing',
        body: 'Starting from the buyer’s brief: confirming the specification, identifying suppliers in China and coordinating replies and samples.',
      },
      {
        index: '02',
        title: 'Coordination',
        body: 'One contact for order details, production dates, documents and handover, with changes reported as they happen.',
      },
      {
        index: '03',
        title: 'Movement',
        body: 'Export preparation and carrier booking coordinated with logistics partners around the agreed destination.',
      },
    ],
    media: MEDIA.aboutOverview,
    mediaNote: 'Illustrative photography. Final brand photography is pending.',
  },

  ledger: {
    index: '03',
    label: 'Service Boundaries',
    heading: 'Clear limits, no assumptions.',
    support:
      'These points define the boundary between Afghan Futian’s coordination and the work performed by suppliers or logistics partners.',
    items: [
      {
        label: 'No unverified figures',
        body: 'We do not publish shipment volumes, client counts or years of operation because none has been supplied for publication.',
      },
      {
        label: 'Partner-operated carriage',
        body: 'Carriers, warehouses and consolidation facilities are provided by partners and described as such.',
      },
      {
        label: 'No inspection claim',
        body: 'Factory audits, laboratory testing and certification are not advertised as Afghan Futian services.',
      },
      {
        label: 'Per-enquiry destinations',
        body: 'Movement is quoted by cargo and destination. No fixed route map is published.',
      },
    ],
  },

  values: {
    index: '04',
    label: 'Values',
    heading: 'How we work.',
    support:
      'Four working commitments that govern how an enquiry is handled.',
  },

  team: {
    label: 'Team',
    body: 'Team profiles will be published only when Afghan Futian confirms the people and their roles.',
  },

  next: {
    eyebrow: 'Where it starts',
    label: 'Product sourcing',
    to: ROUTES.sourcing,
    description: 'The first stage of an order: confirming what to source, from whom and on what terms.',
  },
}

/* ============================================================================
   PRODUCT SOURCING
   ========================================================================= */

export const SOURCING = {
  overview: {
    index: '01',
    label: 'Overview',
    heading: 'Sourcing from Yiwu.',
    support: 'From our base in Yiwu, we work back from the buyer’s brief until there is a concrete supplier, price and sample position to assess.',
    body: 'We confirm specification, tolerance, quantity, packaging, target price and destination first. A vague brief at this stage creates avoidable cost at every later stage.',
  },

  sequence: {
    index: '02',
    label: 'The Sequence',
    heading: 'Four steps, in order.',
    support:
      'Sourcing narrows an enquiry through four decisions, each based on the one before it.',
    items: [
      {
        index: '01',
        title: 'Define the requirement',
        body: 'Specification, quantity, target price, packaging, destination and timeline. We confirm these before contacting suppliers.',
        meta: 'Brief · Quantity · Destination',
      },
      {
        index: '02',
        title: 'Identify suppliers in China',
        body: 'We approach suppliers whose stated capability matches the brief and pass the requirement to them in the same terms.',
        meta: 'Yiwu · Supplier outreach · Capability',
      },
      {
        index: '03',
        title: 'Compare on substance',
        body: 'Quotations and samples are assessed against the original brief, not only against one another.',
        meta: 'Samples · Quotation · Comparison',
      },
      {
        index: '04',
        title: 'Confirm a direction',
        body: 'Once the buyer agrees a supplier and price, the requirement moves into order coordination and documentation.',
        meta: 'Agreement · Order coordination',
      },
    ],
    media: MEDIA.sourcingSequence,
    mediaNote: 'Illustrative photography. Final brand photography is pending.',
  },

  brief: {
    index: '03',
    label: 'What We Need From You',
    heading: 'Six details that speed up sourcing.',
    support:
      'None is mandatory, but an enquiry that includes them usually reaches a supplier decision in fewer exchanges.',
    items: [
      'Product and as much specification as you have',
      'Quantity, and whether it is one-off or repeating',
      'Target price or working range',
      'Delivery location and required date',
      'Packaging, labelling or market requirements',
      'Excluded materials, origins or processes',
    ],
    note: 'A drawing, photograph, sample or reference product is worth more than a long written description.',
  },

  limits: {
    index: '04',
    label: 'Sourcing Boundaries',
    heading: 'How sourcing is scoped.',
    support: 'These boundaries keep enquiries aligned with the work we can quote and arrange.',
    items: [
      {
        label: 'Individual handling',
        body: 'There is no self-service catalogue. Each enquiry is handled individually from brief to supplier response.',
      },
      {
        label: 'No inspection promise',
        body: 'Factory audits, laboratory testing and certification are not advertised as Afghan Futian services.',
      },
      {
        label: 'Prices follow the brief',
        body: 'Cost depends on specification, quantity and destination. We quote once the requirement is clear.',
      },
    ],
  },

  next: {
    label: 'Supply Chain',
    to: ROUTES.supplyChain,
    description: 'What happens after a supplier and price are agreed.',
  },
}

/* ============================================================================
   SUPPLY CHAIN
   ========================================================================= */

export const SUPPLY_CHAIN = {
  overview: {
    index: '01',
    label: 'Overview',
    heading: 'One thread to export.',
    support: 'A confirmed supplier is not a finished order. Dates, order details, documents and handover must stay aligned before goods can move.',
    body: 'Afghan Futian holds that thread. The buyer follows one set of updates instead of chasing separate parties.',
  },

  thread: {
    index: '02',
    label: 'The Thread',
    heading: 'What stays aligned.',
    support:
      'Four moving parts sit between supplier and buyer. We keep them in step.',
    items: [
      {
        index: '01',
        title: 'Production timelines',
        body: 'Agreed dates are tracked against progress, and delays are reported when they are known.',
        meta: 'Dates · Progress · Delays',
      },
      {
        index: '02',
        title: 'Order details',
        body: 'Specification, quantity, packaging and labelling stay consistent with what the buyer approved.',
        meta: 'Specification · Quantity · Packaging',
      },
      {
        index: '03',
        title: 'Documentation',
        body: 'Export and destination documents are gathered as the order progresses, not at the last moment.',
        meta: 'Commercial · Export · Destination',
      },
      {
        index: '04',
        title: 'Handover',
        body: 'The release of goods from supplier to carrier is treated as a distinct stage, with responsibility clearly recorded.',
        meta: 'Consolidation · Release · Movement',
      },
    ],
  },

  singlePoint: {
    index: '03',
    label: 'Why It Matters',
    heading: 'One accountable contact.',
    support:
      'When sourcing, production, documents and movement sit with different companies, the buyer is left joining the gaps.',
    body: 'Holding the thread in one place gives the buyer one version of dates and documents, and one party responsible for spotting changes.',
    media: MEDIA.supplyChainCoordination,
    mediaNote: 'Illustrative photography. Final brand photography is pending.',
  },

  limits: {
    index: '04',
    label: 'Responsibilities',
    heading: 'Where responsibility sits.',
    support: 'Coordination means close attention and clear reporting, not control over every outside event.',
    items: [
      {
        label: 'Dates are tracked, not guaranteed',
        body: 'Production and transit depend on the supplier, season and destination. We report against agreed dates.',
      },
      {
        label: 'Partner facilities',
        body: 'Consolidation and storage are arranged with partners where a requirement needs them.',
      },
      {
        label: 'Changes reported early',
        body: 'We tell the buyer when a date or detail changes, while there is still time to respond.',
      },
    ],
  },

  next: {
    label: 'Logistics',
    to: ROUTES.logistics,
    description: 'How the goods are booked and moved.',
  },
}

/* ============================================================================
   LOGISTICS
   ========================================================================= */

export const LOGISTICS = {
  overview: {
    index: '01',
    label: 'Overview',
    heading: 'Cargo, planned to the destination.',
    support: 'Transport turns an order into a physical movement. We arrange it with logistics partners and plan backwards from the delivery location.',
    body: 'Afghan Futian does not operate carriers or warehouses. We select and coordinate partner services, match them to the cargo and destination, and keep the buyer informed.',
  },

  arrangement: {
    index: '02',
    label: 'How Movement Is Arranged',
    heading: 'Four decisions, made together.',
    support:
      'Transport is a set of linked choices. Destination, service, export paperwork and communication have to work as one.',
    items: [
      {
        index: '01',
        title: 'Destination first',
        body: 'The delivery location and required date determine which transport options are worth pricing.',
        meta: 'Destination · Deadline',
      },
      {
        index: '02',
        title: 'Mode selection',
        body: 'We compare available transport options with logistics partners against cost, transit time and the nature of the cargo.',
        meta: 'Cost · Transit · Cargo',
      },
      {
        index: '03',
        title: 'Export formalities',
        body: 'Export documents and release steps are coordinated so the cargo can leave on schedule.',
        meta: 'Export · Clearance · Release',
      },
      {
        index: '04',
        title: 'Tracking and communication',
        body: 'Progress is followed and reported, so a delay is known before it becomes a missed delivery.',
        meta: 'Tracking · Updates · Arrival',
      },
    ],
    media: MEDIA.logisticsArrangement,
    mediaNote: 'Illustrative photography. Final brand photography is pending.',
  },

  limits: {
    index: '03',
    label: 'Cargo Responsibility',
    heading: 'What partners provide.',
    support:
      'Carriage and storage are supplied by logistics providers. Afghan Futian coordinates the booking and the communication.',
    items: [
      {
        label: 'Carriers',
        body: 'Transport is operated by the selected logistics provider. We select and coordinate it; we do not operate it.',
      },
      {
        label: 'Facilities',
        body: 'Consolidation and storage are arranged with partner facilities when required.',
      },
      {
        label: 'Per-shipment routes',
        body: 'Routes and rates are confirmed against the cargo, destination and timing of each shipment.',
      },
    ],
  },

  mediaNote: 'Illustrative photography. Final brand photography is pending.',

  next: {
    label: 'Global Network',
    to: ROUTES.globalNetwork,
    description: 'How the sourcing base, coordination point and destinations fit together.',
  },
}

/* ============================================================================
   GLOBAL NETWORK
   ========================================================================= */

export const NETWORK_PAGE = {
  shape: {
    index: '01',
    label: 'The Shape of the Operation',
    heading: 'From Yiwu outward.',
    support: 'A sourcing base in Yiwu, coordination through Afghan Futian, and destinations agreed with each buyer. That is the structure we publish.',
    body:
      'This page describes how the work is arranged. We do not publish named routes, ports or volumes until the company confirms them.',
  },

  stations: [
    {
      index: '01',
      role: 'Sourcing base',
      place: 'China',
      detail:
        'Supplier research, product matching and export preparation begin here.',
      status: 'confirmed',
      statusLabel: 'Published base',
    },
    {
      index: '02',
      role: 'Coordination',
      place: 'Afghan Futian',
      detail:
        'One contact for specifications, supplier replies, documents and cargo updates.',
      status: 'confirmed',
      statusLabel: 'Single coordinator',
    },
    {
      index: '03',
      role: 'Destinations',
      place: 'Agreed separately',
      detail:
        'Afghanistan and other agreed buyer markets, quoted by cargo and destination.',
      status: 'pending',
      statusLabel: 'Not yet published',
    },
  ],

  ledger: {
    index: '02',
    label: 'Reading the Diagram',
    heading: 'A structure, not a route map.',
    support:
      'The distinction matters: this shows how the work is arranged, not which lanes we operate.',
    items: [
      {
        label: 'What the diagram shows',
        body: 'A sourcing base, one coordination point and destinations agreed per order.',
      },
      {
        label: 'What it does not show',
        body: 'A route map. Lanes, ports and volumes appear only when confirmed.',
      },
    ],
  },

  future: {
    index: '03',
    label: 'Before a Route Map',
    heading: 'Named routes need confirmed data.',
    body: 'When Afghan Futian can publish the markets it serves and the routes it uses, this page will show them. Until then, we publish the working structure only.',
    media: MEDIA.heroPanel,
    mediaNote: 'Illustrative photography. Final brand photography is pending.',
  },
}

export default { ABOUT, SOURCING, SUPPLY_CHAIN, LOGISTICS, NETWORK_PAGE }
