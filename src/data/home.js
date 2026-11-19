import { CONTACT_DETAILS, ROUTES } from './navigation'

/**
 * HOMEPAGE EDITORIAL COPY
 * ============================================================================
 * Prose for the homepage's narrative sections, kept out of the components so
 * that copy can be revised without touching layout or animation code.
 *
 * Editorial rules (same as `services.js`):
 *  - No invented history, offices, certifications, routes, client numbers,
 *    partnerships, statistics or owned assets.
 *  - Every statement describes *how Afghan Futian works*, never what it owns.
 *  - Nothing here is marked `pending`, because nothing here is a factual claim
 *    that needs verifying — it is all description of method.
 */

/** Section 01 — the introduction that follows the hero. */
export const INTRODUCTION = {
  index: '01',
  label: 'Introduction',
  heading: 'Sourcing, coordination and movement, held together as one operation.',
  lead: 'Afghan Futian connects buyers with suppliers in China, then coordinates everything between them — the sourcing conversation, the production timeline, the export arrangement and the movement of goods toward their destination.',
  body: 'We are not a marketplace, and we are not a directory of suppliers. We work on individual requirements, in the order they actually occur, and we stay with them until the goods reach the destination.',
  /** Compact wayfinding into the three service pages. */
  anchors: [
    { index: '01', label: 'Global Sourcing', to: ROUTES.sourcing },
    { index: '02', label: 'Supply Chain', to: ROUTES.supplyChain },
    { index: '03', label: 'Logistics', to: ROUTES.logistics },
  ],
  /**
   * Visible honesty note. The photography on this site is licensed placeholder
   * material, and saying so in the interface is more defensible than implying
   * these are the company's own facilities.
   */
  mediaNote: 'Illustrative photography — placeholder pending Afghan Futian art direction.',
}

/** Section 02 — the capabilities index. */
export const CAPABILITIES_INTRO = {
  index: '02',
  label: 'Capabilities',
  heading: 'Four capabilities. One continuous chain.',
  support:
    'Sourcing, trade, supply chain and logistics are not four separate products. They are consecutive stages of the same requirement, and we coordinate them as one.',
  /** Caption shown beneath the desktop preview panel. */
  panelCaption: 'Capability in focus',
}

/**
 * Section 03 — the global network.
 *
 * This section is the site's riskiest one, editorially: "global network" is
 * exactly the kind of heading that invites invented offices, invented lanes and
 * invented volumes. It does none of that. Instead it describes the *shape* of
 * the operation — one origin, one coordination point, destinations reached per
 * requirement — and states plainly what it is not.
 *
 * `status` drives the marker: `confirmed` renders a filled accent square,
 * anything else a hollow one. Only two of the three stations are confirmed.
 */
export const NETWORK = {
  index: '03',
  label: 'Global Network',
  heading: 'One origin, coordinated outward.',
  support:
    'Afghan Futian works from a sourcing origin in China and coordinates from there. What follows describes the shape of that operation — not a claim about specific lanes.',
  stations: [
    {
      index: '01',
      role: 'Sourcing origin',
      place: 'China',
      detail: 'Where suppliers, production and export consolidation take place.',
      status: 'confirmed',
      statusLabel: 'Confirmed origin',
    },
    {
      index: '02',
      role: 'Coordination',
      place: 'Afghan Futian',
      detail: 'One point of contact across sourcing, timeline, documentation and movement.',
      status: 'confirmed',
      statusLabel: 'Single coordinator',
    },
    {
      index: '03',
      role: 'Destinations',
      place: 'Worldwide',
      detail: 'Buyer markets, reached according to each individual requirement.',
      status: 'pending',
      statusLabel: 'Pending verification',
    },
  ],
  /** The honesty pair: what the diagram shows, and what it deliberately omits. */
  ledger: [
    {
      label: 'What this shows',
      body: 'The structure of the operation: a sourcing origin, one coordination point, and destinations reached according to each requirement.',
    },
    {
      label: 'What this is not',
      body: 'A route map. No lane, port, market or volume is shown here, because none has been confirmed by Afghan Futian.',
    },
  ],
  mediaNote: 'Illustrative photography — placeholder pending Afghan Futian art direction.',
}

/** Section 04 — the five-stage process. */
export const PROCESS_INTRO = {
  index: '04',
  label: 'Process',
  heading: 'Five stages, in the order they happen.',
  support:
    'Every requirement moves through the same sequence — from first brief to final delivery. Knowing which stage you are in, and what it depends on, is most of the work.',
  /** Label above the desktop progress rail. */
  progressLabel: 'Stages',
}

/** Section 05 — why Afghan Futian. */
export const WHY_INTRO = {
  index: '05',
  label: 'Why Afghan Futian',
  heading: 'Four commitments behind every requirement.',
  support:
    'These describe how we work, not what we have achieved. Where a statement would need evidence we cannot yet show, it has been left out.',
  note: 'No performance statistics are published until they can be verified.',
  link: { label: 'How we work', to: ROUTES.about },
}

/**
 * Closing call to action.
 *
 * Deliberately *not* numbered like the sections above it: those are content,
 * this is an ask. It also carries no promise the company cannot keep — no
 * "we reply within 24 hours", no invented service guarantee. What it does
 * instead is tell the reader how to make their enquiry land, which is both
 * honest and the most useful thing a closing block can say.
 *
 * Rendered by the layout on every route except Contact, where the reader is
 * already on the page this block exists to send them to.
 */
export const CLOSING_CTA = {
  label: 'Next step',
  heading: 'Tell us what you need to move.',
  support:
    'Bring us a requirement — a product, a quantity, a destination. If it can be sourced and moved, we will tell you how. If it cannot, we will tell you that instead.',
  primary: { label: 'Start a Conversation', to: ROUTES.contact },
  secondary: { label: 'Email Afghan Futian', href: CONTACT_DETAILS.emailHref },
  /** A second, lighter route in — for a reader who would rather talk than write. */
  schedule: { label: 'Schedule a Meeting', to: ROUTES.schedule },
  /** Not a guarantee — a checklist. It exists to make the first reply useful. */
  brief: {
    label: 'What helps us respond',
    items: [
      'The product, and its specification',
      'Quantities and target pricing',
      'Where the goods must land',
      'The timeline you are working to',
    ],
  },
}

export default { INTRODUCTION, CAPABILITIES_INTRO, NETWORK, PROCESS_INTRO, WHY_INTRO, CLOSING_CTA }
