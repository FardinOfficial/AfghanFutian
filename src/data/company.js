/**
 * OFFICIAL COMPANY IDENTITY
 * ============================================================================
 * The single source of truth for public company information.
 *
 * Everything rendered on the site — navigation, footer, contact details,
 * scheduling, metadata and email templates — must read from this module. It is
 * deliberately framework-free so the Vercel Functions under `api/` can import
 * it too. Use explicit `.js` extensions on every import from `src/data` so the
 * same file works in Vite and in plain Node ESM.
 *
 * Only officially supplied details live here. There are no opening hours,
 * coordinates, office classifications, personal addresses or invented social
 * accounts. Map links are address searches, not guessed pins.
 */
export const COMPANY = {
  legalName: 'Afghan Futian Trading Company',
  brandName: 'Afghan Futian',
  website: 'https://afghanfutian.com',
  email: 'contact@afghanfutian.com',
  emailHref: 'mailto:contact@afghanfutian.com',
  description:
    'Afghan Futian Trading Company is an international sourcing, trading and supply chain company connecting China with buyers and business opportunities worldwide.',
  phones: [
    {
      id: 'china',
      country: 'China',
      label: 'China',
      display: '+86 147 5788 1420',
      href: 'tel:+8614757881420',
    },
    {
      id: 'afghanistan',
      country: 'Afghanistan',
      label: 'Afghanistan',
      display: '+93 70 513 2426',
      href: 'tel:+93705132426',
    },
  ],
  locations: [
    {
      id: 'yiwu',
      country: 'China',
      city: 'Yiwu',
      label: 'China',
      lines: ['Yiwu, Zhejiang Province, China'],
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=Yiwu%2C%20Zhejiang%20Province%2C%20China',
    },
    {
      id: 'kabul',
      country: 'Afghanistan',
      city: 'Kabul',
      label: 'Afghanistan — Kabul',
      lines: ['3rd Floor, Noor Plaza, Street 2, Qala-e-Fathullah, Kabul, Afghanistan'],
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=3rd%20Floor%2C%20Noor%20Plaza%2C%20Street%202%2C%20Qala-e-Fathullah%2C%20Kabul%2C%20Afghanistan',
    },
    {
      id: 'mandawi',
      country: 'Afghanistan',
      city: 'Mandawi',
      label: 'Afghanistan — Mandawi',
      lines: ['Sader Market, Mandawi, Kabul, Afghanistan'],
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=Sader%20Market%2C%20Mandawi%2C%20Kabul%2C%20Afghanistan',
    },
  ],
  socials: [
    {
      label: 'Facebook',
      icon: 'facebook',
      href: 'https://www.facebook.com/share/19mRWeAZsQ/',
    },
    {
      label: 'Instagram',
      icon: 'instagram',
      href: 'https://www.instagram.com/afghanfutian?hvrq=MXI1b2l3czg1YXI1bQ==',
    },
    {
      label: 'TikTok',
      icon: 'tiktok',
      href: 'https://www.tiktok.com/@afghan.futian.trading.co?_r=1&_t=ZS-9BXDz5gBOc5',
    },
  ],
}

export const SITE_URL = COMPANY.website
export const COMPANY_NAME = COMPANY.legalName
export const COMPANY_EMAIL = COMPANY.email

/** Build an absolute production URL for a path without leaking preview origins. */
export function siteUrl(path = '/') {
  return new URL(path, `${SITE_URL}/`).toString().replace(/\/$/, path === '/' ? '' : '')
}

export default COMPANY
