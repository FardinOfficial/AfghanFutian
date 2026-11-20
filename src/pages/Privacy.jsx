import LegalDoc from '@/components/LegalDoc'
import { useLegal } from '@/i18n/hooks'

/**
 * Privacy Notice.
 *
 * A draft, and marked as one. The content is written from what this codebase
 * actually does — the fields the contact form collects, the absence of cookies
 * and analytics, the Google Fonts and Unsplash requests every page load makes —
 * rather than from a template. Where a decision has not been made (a retention
 * period, the applicable jurisdiction), the notice says so.
 *
 * The document itself lives in `data/legal.js`; this page is the route binding.
 */
export default function Privacy() {
  const { PRIVACY } = useLegal()
  return <LegalDoc doc={PRIVACY} />
}
