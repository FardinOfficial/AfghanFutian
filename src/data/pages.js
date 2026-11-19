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
    heading: 'An operation, not a directory.',
    support: 'Afghan Futian is an international sourcing, trading and supply chain company. We work between China’s supplier base and buyers elsewhere in the world, on individual requirements, in the order those requirements actually occur.',
    body: 'We are not a marketplace and we are not a list of suppliers. A buyer brings us a requirement; we work out what it needs, find where it can come from, and then stay with it — through production, export and movement — until the goods reach their destination.',
  },

  model: {
    index: '02',
    label: 'How We Work',
    heading: 'Three parts, held together.',
    support:
      'Sourcing, coordination and movement are usually handled by separate companies, and the buyer carries the seams between them. We hold all three, which is what makes a single conversation possible.',
    items: [
      {
        index: '01',
        title: 'Sourcing',
        body: 'Starting from the buyer’s requirement rather than a catalogue: clarifying the specification, identifying suppliers in China whose capability matches it, and coordinating the conversation between both sides.',
      },
      {
        index: '02',
        title: 'Coordination',
        body: 'One point of contact across production timelines, order details, documentation and handover, so nothing is lost in the gap between one stage and the next.',
      },
      {
        index: '03',
        title: 'Movement',
        body: 'Export formalities and transportation arranged with logistics partners, planned around where the goods must land rather than around a fixed schedule of our own.',
      },
    ],
    media: MEDIA.aboutOverview,
    mediaNote: 'Illustrative licensed photography — not Afghan Futian’s own operations or assets.',
  },

  ledger: {
    index: '03',
    label: 'In Plain Terms',
    heading: 'What we do not claim.',
    support:
      'A company page is the easiest place on a website to overstate. These are the claims we have deliberately left off ours, and why.',
    items: [
      {
        label: 'We do not publish statistics',
        body: 'No shipment volumes, no client counts, no years of operation. Until Afghan Futian confirms figures it is willing to stand behind, the site carries none.',
      },
      {
        label: 'We do not claim owned assets',
        body: 'Afghan Futian does not present itself as owning vessels, aircraft, warehouses or fleets. Transportation and warehousing are arranged with partners and described as such.',
      },
      {
        label: 'We do not list certifications',
        body: 'No audit, inspection or certification programme is advertised here, because none has been confirmed. Where quality work happens, it happens through the supplier relationship.',
      },
      {
        label: 'We do not invent a network',
        body: 'Destinations are reached according to each requirement, so there is no fixed lane map to publish. The Global Network page explains the shape of the operation instead.',
      },
    ],
  },

  values: {
    index: '04',
    label: 'Values',
    heading: 'What we hold to.',
    support:
      'Four commitments that govern how a requirement is handled — not aspirations, and not marketing.',
  },

  team: {
    label: 'Team',
    body: 'Team profiles are published only when Afghan Futian confirms the people and their roles. Rather than fill this space with stock portraits, it is left empty.',
  },

  next: {
    eyebrow: 'Where it starts',
    label: 'Global Sourcing',
    to: ROUTES.sourcing,
    description: 'The first stage of every requirement, and the one that decides how the rest of it goes.',
  },
}

/* ============================================================================
   GLOBAL SOURCING
   ========================================================================= */

export const SOURCING = {
  overview: {
    index: '01',
    label: 'Overview',
    heading: 'We start where the suppliers are.',
    support: 'Sourcing is the first stage of every requirement, and the one that decides how the rest of it goes. We work from the buyer’s brief backwards, in China, until there is something concrete to decide on.',
    body: 'That means asking the unglamorous questions first — specification, tolerance, quantity, packaging, target price, destination — because a requirement that is vague at this stage becomes expensive at every stage after it.',
  },

  sequence: {
    index: '02',
    label: 'The Sequence',
    heading: 'Four moves, in order.',
    support:
      'Sourcing is not a search box. It is a sequence of narrowing decisions, and each one depends on the one before it.',
    items: [
      {
        index: '01',
        title: 'Define the requirement',
        body: 'Specification, quantity, target pricing, packaging, destination and timeline. We would rather ask now than correct later.',
        meta: 'Brief · Specification · Target',
      },
      {
        index: '02',
        title: 'Identify suppliers in China',
        body: 'We approach suppliers whose stated capability matches the confirmed requirement, and put the requirement to them in the same terms it was given to us.',
        meta: 'Supplier outreach · Capability match',
      },
      {
        index: '03',
        title: 'Compare on substance',
        body: 'Quotations and samples are compared against the brief — not against each other in isolation. The cheapest answer to the wrong question is still the wrong answer.',
        meta: 'Samples · Quotation · Comparison',
      },
      {
        index: '04',
        title: 'Confirm a direction',
        body: 'Once a supplier and an arrangement are agreed with the buyer, the requirement moves into coordination: timelines, order details and documentation.',
        meta: 'Agreement · Handover to coordination',
      },
    ],
    media: MEDIA.sourcingSequence,
    mediaNote: 'Illustrative licensed photography — not Afghan Futian’s own operations or assets.',
  },

  brief: {
    index: '03',
    label: 'What We Need From You',
    heading: 'Six things that make sourcing faster.',
    support:
      'None of these are mandatory, and we will work without them. But an enquiry that carries them usually reaches a decision in one exchange rather than several.',
    items: [
      'The product, and as much of its specification as you have',
      'Quantities, and whether they are one-off or repeating',
      'Target pricing, or the range you are working within',
      'Where the goods must land, and by when',
      'Packaging, labelling or market requirements the goods must satisfy',
      'Anything the product must not be — materials, origins, processes',
    ],
    note: 'If you have a drawing, a photograph, a sample or a competitor’s product, send it. A reference is worth a paragraph of description.',
  },

  limits: {
    index: '04',
    label: 'In Plain Terms',
    heading: 'What this is not.',
    support: 'Sourcing is often sold with promises attached. Here is what ours does not include.',
    items: [
      {
        label: 'Not a marketplace',
        body: 'You do not browse a catalogue and place an order. Every requirement is worked individually, which is slower at the start and considerably faster afterwards.',
      },
      {
        label: 'Not an inspection service',
        body: 'We do not advertise factory audits, laboratory testing or certification, because none has been confirmed. Where quality is verified, it is through the supplier relationship and stated as such.',
      },
      {
        label: 'Not a price list',
        body: 'Cost depends on specification, quantity and destination. We would rather quote against a real requirement than publish a number that fits none of them.',
      },
    ],
  },

  next: {
    label: 'Supply Chain',
    to: ROUTES.supplyChain,
    description: 'What happens once a supplier and an arrangement are confirmed.',
  },
}

/* ============================================================================
   SUPPLY CHAIN
   ========================================================================= */

export const SUPPLY_CHAIN = {
  overview: {
    index: '01',
    label: 'Overview',
    heading: 'Coordination is the product.',
    support: 'A confirmed supplier is not a finished job. Between the agreement and the shipped goods sits a stretch of work that is mostly invisible — timelines, order details, documentation and handover — and it is where requirements most often go wrong.',
    body: 'We hold that stretch. One thread runs from the requirement through production and export, and the buyer follows that thread instead of chasing several parties along it.',
  },

  thread: {
    index: '02',
    label: 'The Thread',
    heading: 'What is actually coordinated.',
    support:
      'These are the four things that move between a supplier and a buyer, and the four things we keep in step.',
    items: [
      {
        index: '01',
        title: 'Production timelines',
        body: 'Agreed dates are tracked against reality, and slippage is reported when it happens rather than when the shipment is due.',
        meta: 'Dates · Progress · Slippage',
      },
      {
        index: '02',
        title: 'Order details',
        body: 'Specification, quantity, packaging and labelling stay consistent between what the buyer approved and what the supplier produces.',
        meta: 'Specification · Quantity · Packaging',
      },
      {
        index: '03',
        title: 'Documentation',
        body: 'The paperwork a shipment needs to leave and to arrive is gathered as the order progresses, not scrambled together at the port.',
        meta: 'Commercial · Export · Destination',
      },
      {
        index: '04',
        title: 'Handover',
        body: 'The point where goods leave the supplier and enter movement is the point most easily lost. We treat it as a stage in its own right.',
        meta: 'Consolidation · Release · Movement',
      },
    ],
  },

  singlePoint: {
    index: '03',
    label: 'Why It Matters',
    heading: 'One conversation instead of five.',
    support:
      'When sourcing, production, documentation and movement sit with different companies, the buyer becomes the integration layer — chasing updates, reconciling versions and absorbing every gap between them.',
    body: 'Holding all four in one place does not remove the gaps; international trade is full of them. It means there is one party responsible for noticing them, and one version of events to work from.',
    media: MEDIA.supplyChainCoordination,
    mediaNote: 'Illustrative licensed photography — not Afghan Futian’s own operations or assets.',
  },

  limits: {
    index: '04',
    label: 'In Plain Terms',
    heading: 'What we do not promise.',
    support: 'Coordination is a commitment about attention, not a guarantee about outcomes.',
    items: [
      {
        label: 'No guaranteed lead times',
        body: 'Production and transit depend on the supplier, the season and the destination. We track and report against agreed dates; we do not override them.',
      },
      {
        label: 'No owned warehousing',
        body: 'Consolidation and storage are arranged with partners where a requirement needs them. Afghan Futian does not present partner facilities as its own.',
      },
      {
        label: 'No silent problems',
        body: 'The one thing we do commit to is telling you when something changes. A problem reported early is a problem that can still be managed.',
      },
    ],
  },

  next: {
    label: 'Logistics',
    to: ROUTES.logistics,
    description: 'How coordinated goods are arranged to move, and to arrive.',
  },
}

/* ============================================================================
   LOGISTICS
   ========================================================================= */

export const LOGISTICS = {
  overview: {
    index: '01',
    label: 'Overview',
    heading: 'Movement, arranged around the destination.',
    support: 'Transportation is where a requirement stops being a plan and becomes a physical thing in a physical place. We arrange and coordinate that movement with logistics partners, and we plan it backwards from where the goods must land.',
    body: 'Afghan Futian does not own vessels, aircraft, warehouses or fleets. What we do is choose, book and coordinate — matching mode, route and schedule to the destination and the deadline, then keeping the buyer informed while it happens.',
  },

  arrangement: {
    index: '02',
    label: 'How Movement Is Arranged',
    heading: 'Four decisions, taken together.',
    support:
      'Transportation looks like a choice of mode. In practice it is four interlocking decisions, and taking them separately is how shipments end up expensive or late.',
    items: [
      {
        index: '01',
        title: 'Destination first',
        body: 'Where the goods must land, and by when, decides almost everything else — including which mode is even worth pricing.',
        meta: 'Destination · Deadline',
      },
      {
        index: '02',
        title: 'Mode selection',
        body: 'Sea, air, rail or road, chosen with our logistics partners against the trade-off between cost, transit time and cargo.',
        meta: 'Sea · Air · Rail · Road',
      },
      {
        index: '03',
        title: 'Export formalities',
        body: 'The export side of the movement is coordinated so the cargo is cleared to leave rather than held at the point of departure.',
        meta: 'Export · Clearance · Release',
      },
      {
        index: '04',
        title: 'Tracking and communication',
        body: 'Shipment progress is followed and reported, so the buyer learns about a delay from us rather than from a delivery that did not arrive.',
        meta: 'Tracking · Updates · Arrival',
      },
    ],
    media: MEDIA.logisticsArrangement,
    mediaNote: 'Illustrative licensed photography — not Afghan Futian’s own operations or assets.',
  },

  limits: {
    index: '03',
    label: 'In Plain Terms',
    heading: 'What we do not own.',
    support:
      'This is the page where a logistics company is most tempted to imply a fleet. We would rather be clear.',
    items: [
      {
        label: 'No owned vessels or aircraft',
        body: 'Carriage is performed by our logistics partners. We select and coordinate it; we do not operate it.',
      },
      {
        label: 'No owned warehouses',
        body: 'Where consolidation or storage is needed, it is arranged with a partner facility and described as partner-operated.',
      },
      {
        label: 'No fixed lanes',
        body: 'Because movement follows each requirement, there is no published route network to promise. Destinations are quoted per shipment.',
      },
    ],
  },

  mediaNote: 'Illustrative licensed photography — not Afghan Futian’s own operations or assets.',

  next: {
    label: 'Global Network',
    to: ROUTES.globalNetwork,
    description: 'How the origin, the coordination point and the destinations fit together.',
  },
}

/* ============================================================================
   GLOBAL NETWORK
   ========================================================================= */

export const NETWORK_PAGE = {
  shape: {
    index: '01',
    label: 'The Shape of the Operation',
    heading: 'One origin, coordinated outward.',
    support: 'A sourcing origin in China. A single coordination point. Destinations reached according to each requirement. That is the whole structure, and it is deliberately simple.',
    body:
      'What follows describes how the operation is arranged. It is not a claim about specific trade lanes, and no port, market or volume appears here until Afghan Futian confirms it.',
  },

  stations: [
    {
      index: '01',
      role: 'Sourcing origin',
      place: 'China',
      detail:
        'Where suppliers, production and export consolidation take place. This is the fixed point everything else is arranged around.',
      status: 'confirmed',
      statusLabel: 'Confirmed origin',
    },
    {
      index: '02',
      role: 'Coordination',
      place: 'Afghan Futian',
      detail:
        'One point of contact across sourcing, timeline, documentation and movement — the party responsible for the seams between them.',
      status: 'confirmed',
      statusLabel: 'Single coordinator',
    },
    {
      index: '03',
      role: 'Destinations',
      place: 'Worldwide',
      detail:
        'Buyer markets, reached according to each individual requirement rather than a fixed schedule of lanes.',
      status: 'pending',
      statusLabel: 'Pending verification',
    },
  ],

  ledger: {
    index: '02',
    label: 'In Plain Terms',
    heading: 'A diagram, not a map.',
    support:
      'The distinction matters, and it is the reason this page does not show you a world map with arcs across it.',
    items: [
      {
        label: 'What this shows',
        body: 'The structure of the operation: one sourcing origin, one coordination point, and destinations reached per requirement.',
      },
      {
        label: 'What this is not',
        body: 'A route map. No lane, port, market or volume is shown, because none has been confirmed by Afghan Futian.',
      },
    ],
  },

  future: {
    index: '03',
    label: 'What Would Change This Page',
    heading: 'It becomes a map when there is one to draw.',
    body: 'A network diagram is only as honest as the data behind it. When Afghan Futian confirms the destinations it serves and is willing to publish them, this page gains a real map — named markets, real lanes, and the volumes to go with them. Until then it stays a diagram, and it says so.',
    media: MEDIA.heroPanel,
    mediaNote: 'Illustrative licensed photography — not Afghan Futian’s own operations or assets.',
  },
}

export default { ABOUT, SOURCING, SUPPLY_CHAIN, LOGISTICS, NETWORK_PAGE }
