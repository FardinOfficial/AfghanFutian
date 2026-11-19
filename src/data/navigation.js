import { COMPANY } from './company.js'
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
  { label: 'Schedule a Meeting', to: ROUTES.schedule },
  { label: 'Contact', to: ROUTES.contact },
]

/**
 * Contact details, re-exported from the official company record.
 *
 * The `phone`, `phoneHref` and `addressLines` fields remain for components that
 * only need one primary contact; new code should use `phones` and `locations`,
 * which carry every officially supplied number and office.
 */
export const CONTACT_DETAILS = {
  email: COMPANY.email,
  emailHref: COMPANY.emailHref,
  phone: COMPANY.phones[0].display,
  phoneHref: COMPANY.phones[0].href,
  phones: COMPANY.phones,
  locations: COMPANY.locations,
  addressLines: COMPANY.locations[0].lines,
  isPlaceholder: false,
}

/** Official social profiles, with the exact supplied URLs. */
export const SOCIAL_LINKS = COMPANY.socials.map(({ label, icon, href }) => ({
  label,
  icon,
  href,
}))

/** Metadata used for any route that is not in `PAGE_META` (i.e. a 404). */
export const NOT_FOUND_META = {
  title: 'Page Not Found — Afghan Futian Trading Company',
  description:
    'The page you were looking for has moved or was never here. Return to Afghan Futian Trading Company to explore our sourcing, supply chain and logistics services.',
}

/** Per-route document metadata, applied by the layout on navigation. */
export const PAGE_META = {
  [ROUTES.home]: {
    title: 'Afghan Futian Trading Company — Connecting Markets. Moving the World.',
    description:
      'Global sourcing, supply chain and logistics solutions from Afghan Futian Trading Company, connecting China with opportunities worldwide.',
    image: DEFAULT_OG_IMAGE,
  },
  [ROUTES.about]: {
    title: 'About Us — Afghan Futian Trading Company',
    description:
      'Learn how Afghan Futian Trading Company connects sourcing operations in China with international buyers through coordinated supply chain and logistics.',
  },
  [ROUTES.sourcing]: {
    title: 'Global Sourcing — Afghan Futian Trading Company',
    description:
      'Product and supplier sourcing in China, coordinated end to end for international buyers by Afghan Futian Trading Company.',
  },
  [ROUTES.supplyChain]: {
    title: 'Supply Chain — Afghan Futian Trading Company',
    description:
      'Supply chain coordination that carries a requirement from first sourcing conversation through to export.',
  },
  [ROUTES.logistics]: {
    title: 'Logistics — Afghan Futian Trading Company',
    description:
      'International cargo and transportation coordination, arranged around your destination and timeline.',
  },
  [ROUTES.globalNetwork]: {
    title: 'Global Network — Afghan Futian Trading Company',
    description:
      'An illustrative view of how Afghan Futian Trading Company connects its China sourcing origin with markets worldwide.',
  },
  [ROUTES.contact]: {
    title: 'Contact — Afghan Futian Trading Company',
    description:
      'Start a conversation with Afghan Futian Trading Company about your sourcing requirement or international business opportunity.',
  },
  [ROUTES.schedule]: {
    title: 'Schedule a Meeting — Afghan Futian Trading Company',
    description:
      'Book a meeting with Afghan Futian Trading Company. Choose a date and time that suits you and receive confirmation and joining details by email.',
  },
  [ROUTES.privacy]: {
    title: 'Privacy Notice — Afghan Futian Trading Company',
    description:
      'How Afghan Futian Trading Company handles information sent through this website, including the contact form, meeting booker and third-party requests a page makes.',
  },
  [ROUTES.terms]: {
    title: 'Terms of Use — Afghan Futian Trading Company',
    description:
      'The terms on which the Afghan Futian Trading Company website is provided, and what its content does and does not represent.',
  },
}
