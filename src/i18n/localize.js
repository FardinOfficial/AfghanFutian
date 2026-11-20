/**
 * Deep localizer for the site's existing data objects.
 *
 * The content modules in `src/data` are deliberately plain data. Rather than
 * duplicating their shape in translation files, every string is used as an
 * i18next key and the object shape is reconstructed with translated values.
 * This keeps routes, ids, media records, validation constraints and all other
 * machine values untouched while translating only human-facing copy.
 */

/** Keys whose values are machine data, never interface copy. */
const MACHINE_KEYS = new Set([
  'id',
  'name',
  'to',
  'href',
  'src',
  'srcSet',
  'icon',
  'type',
  'required',
  'autoComplete',
  'inputMode',
  'maxLength',
  'minLength',
  'rows',
  'index',
  'status',
  'aspect',
  'priority',
  'sizes',
  'width',
  'height',
  'mapUrl',
  'image',
  'robots',
  'display',
  'phone',
  'phoneHref',
  'email',
  'emailHref',
  'website',
  'legalName',
  'brandName',
  'siteUrl',
  'company',
  'isPlaceholder',
  'CAL_LINK',
  'CAL_EMBED_URL',
  'CAL_PUBLIC_URL',
  'CAL_ORIGINS',
  'DEFAULT_TIME_ZONE',
  'DEFAULT_TIME_ZONE_OFFSET',
  'IS_SCHEDULING_CONFIGURED',
  'SCHEDULE_FALLBACK_EMAIL',
])

/** Values that are identifiers rather than prose, regardless of their key. */
const MACHINE_VALUE = /^(?:https?:\/\/|mailto:|tel:|\/|#)|^[\d\s+().,/:-]+$/

const isMachineValue = (value) =>
  typeof value !== 'string' || MACHINE_VALUE.test(value.trim())

/**
 * Recursively translate every human-facing string in `value`.
 *
 * @param {unknown} value data object, array or string
 * @param {string} namespace i18next namespace holding the translations
 * @param {(key: string, options?: object) => string} tr translation function
 */
export function localize(value, namespace, tr) {
  if (typeof value === 'string') {
    return isMachineValue(value) ? value : tr(value, { ns: namespace })
  }

  if (Array.isArray(value)) {
    return value.map((item) => localize(item, namespace, tr))
  }

  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      // Alternative text lives in its own namespace: every media record across
      // every module shares the same small set of descriptions.
      if (key === 'alt' && typeof child === 'string') {
        return [key, tr(child, { ns: 'media' })]
      }
      if (MACHINE_KEYS.has(key)) return [key, child]
      return [key, localize(child, namespace, tr)]
    }),
  )
}

export default localize
