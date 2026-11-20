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
  heading: 'Yiwu sourcing, coordinated through to delivery.',
  lead: 'Afghan Futian connects buyers with suppliers in China and coordinates the work between them: product and supplier research, order details, export documents and cargo movement.',
  body: 'Each enquiry is handled on its own terms. We agree the specification and destination first, then arrange the steps needed to get the goods there.',
  /** Compact wayfinding into the three service pages. */
  anchors: [
    { index: '01', label: 'Product sourcing', to: ROUTES.sourcing },
    { index: '02', label: 'Supply Chain', to: ROUTES.supplyChain },
    { index: '03', label: 'Logistics', to: ROUTES.logistics },
  ],
  /**
   * Visible honesty note. The photography on this site is licensed placeholder
   * material, and saying so in the interface is more defensible than implying
   * these are the company's own facilities.
   */
  mediaNote: 'Illustrative photography. Final brand photography is pending.',
}

/** Section 02 — the capabilities index. */
export const CAPABILITIES_INTRO = {
  index: '02',
  label: 'Capabilities',
  heading: 'Four services, one trade requirement.',
  support:
    'Sourcing, trade, supply chain and logistics are consecutive stages of one order. Afghan Futian coordinates them as one operation.',
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
  heading: 'From Yiwu, coordinated to the destination.',
  support:
    'Our sourcing work starts in China. Afghan Futian coordinates the order from there; destinations are agreed with each buyer.',
  stations: [
    {
      index: '01',
      role: 'Sourcing base',
      place: 'China',
      detail: 'Supplier research, product matching and export preparation begin here.',
      status: 'confirmed',
      statusLabel: 'Published base',
    },
    {
      index: '02',
      role: 'Coordination',
      place: 'Afghan Futian',
      detail: 'One contact for specifications, supplier replies, documents and cargo updates.',
      status: 'confirmed',
      statusLabel: 'Single coordinator',
    },
    {
      index: '03',
      role: 'Destinations',
      place: 'Agreed separately',
      detail: 'Afghanistan and other agreed buyer markets, quoted by cargo and destination.',
      status: 'pending',
      statusLabel: 'Not yet published',
    },
  ],
  /** The honesty pair: what the diagram shows, and what it deliberately omits. */
  ledger: [
    {
      label: 'What this shows',
      body: 'A sourcing base, one coordination point and destinations agreed per order.',
    },
    {
      label: 'What this is not',
      body: 'A route map. Lanes, ports and volumes appear only when confirmed.',
    },
  ],
  mediaNote: 'Illustrative photography. Final brand photography is pending.',
}

/** Section 04 — the five-stage process. */
export const PROCESS_INTRO = {
  index: '04',
  label: 'Process',
  heading: 'Five steps from brief to arrival.',
  support:
    'Every enquiry follows a clear sequence. Knowing the current stage and what it depends on keeps the order moving.',
  /** Label above the desktop progress rail. */
  progressLabel: 'Stages',
}

/** Section 05 — why Afghan Futian. */
export const WHY_INTRO = {
  index: '05',
  label: 'Why Afghan Futian',
  heading: 'Four working commitments.',
  support:
    'These describe how an enquiry is handled. We do not use unverified performance claims.',
  note: 'Our public descriptions focus on method, not on unverified performance figures.',
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
  heading: 'Send us the requirement.',
  support:
    'Share the product, quantity, destination and timing. We will confirm what we can source and how the goods can move — or tell you if the request falls outside our scope.',
  primary: { label: 'Discuss Your Requirement', to: ROUTES.contact },
  secondary: { label: 'Email Afghan Futian', href: CONTACT_DETAILS.emailHref },
  /** A second, lighter route in — for a reader who would rather talk than write. */
  schedule: { label: 'Schedule a Meeting', to: ROUTES.schedule },
  /** Not a guarantee — a checklist. It exists to make the first reply useful. */
  brief: {
    label: 'Include in your first message',
    items: [
      'Product and specification',
      'Quantity and target price',
      'Delivery location',
      'Required timeline',
    ],
  },
}

export default { INTRODUCTION, CAPABILITIES_INTRO, NETWORK, PROCESS_INTRO, WHY_INTRO, CLOSING_CTA }
