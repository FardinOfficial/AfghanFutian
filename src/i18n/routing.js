/**
 * Locale-aware routing helpers.
 *
 * The site keeps its original English URLs (/, /about, /contact, …) and adds
 * explicit locale prefixes for Pashto (/ps/…) and Dari (/fa/…). The internal
 * locale id for Dari is `fa-AF`, matching the HTML `lang` value and the
 * translation resource folder; only the public URL uses the shorter `/fa`.
 *
 * These helpers are framework-free so they can be used by the i18n bootstrap,
 * React components, document metadata and tests alike.
 */

export const LOCALES = ['en', 'ps', 'fa-AF']

/** Internal locale id → public URL prefix (empty for English). */
export const LOCALE_PREFIX = {
  en: '',
  ps: '/ps',
  'fa-AF': '/fa',
}

/** Public URL prefix → internal locale id. */
export const PREFIX_LOCALE = {
  '/ps': 'ps',
  '/fa': 'fa-AF',
}

/** Internal locale id → values required on the root <html> element. */
export const HTML_ATTRIBUTES = {
  en: { lang: 'en', dir: 'ltr' },
  ps: { lang: 'ps', dir: 'rtl' },
  'fa-AF': { lang: 'fa-AF', dir: 'rtl' },
}

/** Internal locale id → Open Graph locale value. */
export const OG_LOCALE = {
  en: 'en_US',
  ps: 'ps_AF',
  'fa-AF': 'fa_AF',
}

export const STORAGE_KEY = 'afghan-futian-locale'

/**
 * Read the locale encoded in a pathname, if any.
 * `@example localeFromPath('/ps/about') // 'ps'`
 */
export function localeFromPath(pathname = '') {
  const path = String(pathname || '')
  if (path === '/ps' || path.startsWith('/ps/')) return 'ps'
  if (path === '/fa' || path.startsWith('/fa/')) return 'fa-AF'
  return null
}

/** Strip a locale prefix, returning the real application path. */
export function stripLocale(pathname = '') {
  const path = String(pathname || '/')
  if (path === '/ps') return '/'
  if (path.startsWith('/ps/')) return path.slice(3) || '/'
  if (path === '/fa') return '/'
  if (path.startsWith('/fa/')) return path.slice(3) || '/'
  return path
}

/** Add the current locale's prefix to an application path. */
export function localizedPath(path = '/', locale = 'en') {
  const clean = String(path || '/')
  const prefix = LOCALE_PREFIX[locale] ?? ''
  if (!prefix) return clean
  if (clean === '/') return prefix
  if (clean === prefix || clean.startsWith(prefix + '/')) return clean
  return `${prefix}${clean.startsWith('/') ? '' : '/'}${clean}`
}

/** True when a value is a supported internal locale id. */
export function isLocale(value) {
  return LOCALES.includes(value)
}

/** Read the persisted preference from localStorage (browser only). */
export function readStoredLocale() {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

/** Persist a language preference (browser only). */
export function storeLocale(locale) {
  if (typeof window === 'undefined' || !isLocale(locale)) return
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* storage can be disabled; the URL still carries the choice */
  }
}

/**
 * Resolve the initial language. Explicit URL prefixes win over a stored
 * preference, which in turn wins over the English default.
 */
export function initialLocale(pathname) {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  // A prefixed URL always wins. The stored preference only applies to the
  // unprefixed homepage, so an explicitly entered English deep link stays in
  // English rather than silently switching language.
  return localeFromPath(path) ?? (stripLocale(path) === '/' ? readStoredLocale() : null) ?? 'en'
}

/**
 * Build the URL to navigate to when the visitor picks a new language, keeping
 * the current page and any hash/query intact.
 */
export function switchedPath(pathname, search, hash, locale) {
  const base = localizedPath(stripLocale(pathname || '/'), locale)
  return `${base}${search || ''}${hash || ''}`
}
