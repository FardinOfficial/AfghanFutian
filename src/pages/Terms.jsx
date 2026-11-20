import LegalDoc from '@/components/LegalDoc'
import { useLegal } from '@/i18n/hooks'

/**
 * Terms of Use.
 *
 * A draft, and marked as one. The terms say the things this site makes easy to
 * get wrong: that the content is information rather than an offer, that the
 * photography is placeholder imagery rather than a record of owned assets, and
 * that the contact details shown are stand-ins.
 *
 * The document itself lives in `data/legal.js`; this page is the route binding.
 */
export default function Terms() {
  const { TERMS } = useLegal()
  return <LegalDoc doc={TERMS} />
}
