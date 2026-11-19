import { DEFAULT_OG_IMAGE } from './media'

/**
 * Central route registry.
 *
 * Every navigational surface (navbar, footer, mobile menu, CTA buttons) reads
 * from this file, so adding a page is a one-line change rather than a hunt
 * through components.
 */

export const ROUTES = {
  home: '/',
  about: '/about',
  sourcing: '/sourcing',
  supplyChain: '/supply-chain',
  logistics: '/logistics',
  globalNetwork: '/global-network',
  schedule: '/schedule',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
}

/**
 * Primary navigation. `label` is the visible text, `title` feeds the mobile
 * menu's editorial typography, `index` drives the numbering in the overlay.
 */
export const PRIMARY_NAV = [
  { label: 'Home', title: 'Home', to: ROUTES.home, index: '01' },
  { label: 'About', title: 'About Us', to: ROUTES.about, index: '02' },
  { label: 'Sourcing', title: 'Sourcing', to: ROUTES.sourcing, index: '03' },
  { label: 'Supply Chain', title: 'Supply Chain', to: ROUTES.supplyChain, index: '04' },
  { label: 'Logistics', title: 'Logistics', to: ROUTES.logistics, index: '05' },
  { label: 'Global Network', title: 'Global Network', to: ROUTES.globalNetwork, index: '06' },
  { label: 'Contact', title: 'Contact', to: ROUTES.contact, index: '07' },
]

/** The condensed set shown inline in the desktop navbar. */
export const NAVBAR_LINKS = PRIMARY_NAV.filter((item) =>
  [ROUTES.about, ROUTES.sourcing, ROUTES.supplyChain, ROUTES.logistics, ROUTES.globalNetwork].includes(
    item.to,
  ),
)

/** Services column in the footer. */
export const FOOTER_SERVICES = [
  { label: 'Global Sourcing', to: ROUTES.sourcing },
  { label: 'International Trade', to: ROUTES.sourcing },
  { label: 'Supply Chain', to: ROUTES.supplyChain },
  { label: 'Logistics', to: ROUTES.logistics },
  { label: 'Global Network', to: ROUTES.globalNetwork },
]

/**
 * Legal links, kept out of the primary navigation and the footer columns — a
 * legal page belongs in the footer's legal bar, not alongside the services. The
 * footer renders these from here so the two documents are declared in one place.
 */
export const LEGAL_LINKS = [
  { label: 'Privacy', to: ROUTES.privacy },
  { label: 'Terms', to: ROUTES.terms },
]

/** Company column in the footer. */
export const FOOTER_COMPANY = [
  { label: 'About Us', to: ROUTES.about },
  { label: 'Our Process', to: `${ROUTES.home}#process` },
  { label: 'Why Afghan Futian', to: `${ROUTES.home}#why` },
  { label: 'Contact', to: ROUTES.contact },
]

/**
 * Placeholder contact details.
 *
 * These are intentionally obvious stand-ins and must be replaced with the
 * company's real details before launch. They are gathered here so that the
 * replacement is a single-file edit.
 */
export const CONTACT_DETAILS = {
  email: 'contact@afghanfutian.com',
  emailHref: 'mailto:contact@afghanfutian.com',
  phone: '+00 000 000 000',
  phoneHref: 'tel:+000000000000',
  addressLines: ['Registered office address', 'To be confirmed'],
  hours: 'Sunday – Thursday, 09:00 – 18:00',
  isPlaceholder: true,
}

/**
 * Social profiles.
 *
 * `href: null` means the account is not yet confirmed. The SocialLinks
 * component renders those as plain text rather than a link — a link that goes
 * nowhere is worse than no link. Filling in a real URL automatically promotes
 * the entry to an anchor with the correct external-link attributes.
 */
export const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: null },
  { label: 'Instagram', href: null },
  { label: 'Facebook', href: null },
  { label: 'WhatsApp', href: null },
]

/** Metadata used for any route that is not in `PAGE_META` (i.e. a 404). */
export const NOT_FOUND_META = {
  title: 'Page Not Found — Afghan Futian',
  description:
    'The page you were looking for has moved or was never here. Return to Afghan Futian to explore our sourcing, supply chain and logistics services.',
}

/** Per-route document metadata, applied by the layout on navigation. */
export const PAGE_META = {
  [ROUTES.home]: {
    title: 'Afghan Futian — Connecting Markets. Moving the World.',
    description:
      'Global sourcing, supply chain and logistics solutions connecting China with opportunities worldwide.',
    image: DEFAULT_OG_IMAGE,
  },
  [ROUTES.about]: {
    title: 'About Us — Afghan Futian',
    description:
      'Learn how Afghan Futian connects sourcing operations in China with international buyers through coordinated supply chain and logistics.',
  },
  [ROUTES.sourcing]: {
    title: 'Global Sourcing — Afghan Futian',
    description:
      'Product and supplier sourcing in China, coordinated end to end for international buyers.',
  },
  [ROUTES.supplyChain]: {
    title: 'Supply Chain — Afghan Futian',
    description:
      'Supply chain coordination that carries a requirement from first sourcing conversation through to export.',
  },
  [ROUTES.logistics]: {
    title: 'Logistics — Afghan Futian',
    description:
      'International cargo and transportation coordination, arranged around your destination and timeline.',
  },
  [ROUTES.globalNetwork]: {
    title: 'Global Network — Afghan Futian',
    description:
      'An illustrative view of how Afghan Futian connects its China sourcing origin with markets worldwide.',
  },
  [ROUTES.contact]: {
    title: 'Contact — Afghan Futian',
    description:
      'Start a conversation about your sourcing requirement or international business opportunity.',
  },
  [ROUTES.schedule]: {
    title: 'Schedule a Meeting — Afghan Futian',
    description:
      'Book a meeting with Afghan Futian. Choose a date and time that suits you and receive confirmation and joining details by email.',
  },
  [ROUTES.privacy]: {
    title: 'Privacy Notice — Afghan Futian',
    description:
      'How Afghan Futian handles information sent through this website, including the contact form and the third-party requests a page makes.',
  },
  [ROUTES.terms]: {
    title: 'Terms of Use — Afghan Futian',
    description:
      'The terms on which the Afghan Futian website is provided, and what its content does and does not represent.',
  },
}
