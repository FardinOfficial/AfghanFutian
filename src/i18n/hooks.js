import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { ABOUT, LOGISTICS, NETWORK_PAGE, SOURCING, SUPPLY_CHAIN } from '@/data/pages'
import { COMPANY, siteUrl } from '@/data/company.js'
import { CONTACT_FORM_COPY, CONTACT_FORM_FIELDS } from '@/data/contact'
import { LEGAL_CONTACT, LEGAL_DRAFT, PRIVACY, TERMS } from '@/data/legal'
import { MEDIA } from '@/data/media'
import {
  CONTACT_DETAILS,
  FOOTER_COMPANY,
  FOOTER_SERVICES,
  LEGAL_LINKS,
  NAVBAR_LINKS,
  NOT_FOUND_META,
  PAGE_META,
  PRIMARY_NAV,
  ROUTES,
  SOCIAL_LINKS,
} from '@/data/navigation'
import { CAPABILITIES, DIFFERENTIATORS, PROCESS_STEPS, VALUES } from '@/data/services'
import {
  CAL_LINK,
  CAL_PUBLIC_URL,
  DEFAULT_TIME_ZONE,
  DEFAULT_TIME_ZONE_LABEL,
  IS_SCHEDULING_CONFIGURED,
  SCHEDULE_COPY,
} from '@/data/scheduling'
import HOME from '@/data/home'

import { localize } from './localize'
import { runLocaleTransition } from './transition'
import {
  HTML_ATTRIBUTES,
  OG_LOCALE,
  localeFromPath,
  localizedPath,
  readStoredLocale,
  storeLocale,
  stripLocale,
  switchedPath,
} from './routing'

/**
 * The active locale, derived from the URL first and the stored preference
 * second. Call this once in the layout so the document attributes follow the
 * route on direct loads, refreshes and history navigation alike.
 */
export function useLocale() {
  const { i18n } = useTranslation()
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()

  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en'
  const activeLocale = ['en', 'ps', 'fa-AF'].includes(locale) ? locale : 'en'
  const transitioningRef = useRef(false)
  const [transitioning, setTransitioning] = useState(false)

  // Explicit URL prefixes override the stored preference. This also keeps the
  // language in step with browser back/forward navigation.
  useEffect(() => {
    const next = localeFromPath(pathname) ?? (stripLocale(pathname) === '/' ? readStoredLocale() : null) ?? 'en'
    if (next !== i18n.resolvedLanguage && next !== i18n.language) {
      i18n.changeLanguage(next)
    }
  }, [pathname, i18n])

  useEffect(() => {
    const attributes = HTML_ATTRIBUTES[activeLocale] ?? HTML_ATTRIBUTES.en
    document.documentElement.lang = attributes.lang
    document.documentElement.dir = attributes.dir
  }, [activeLocale])

  const switchTo = useCallback(
    async (nextLocale) => {
      if (!['en', 'ps', 'fa-AF'].includes(nextLocale) || nextLocale === activeLocale) return
      // A second click while the curtain is down would stack preloaders and
      // fight over the same URL. The first change wins; buttons are disabled
      // for the duration of the transition.
      if (transitioningRef.current) return

      // Persist first: a refresh during the curtain keeps the chosen language.
      storeLocale(nextLocale)

      const apply = () => {
        i18n.changeLanguage(nextLocale)
        navigate(switchedPath(pathname, search, hash, nextLocale))
      }

      transitioningRef.current = true
      setTransitioning(true)
      try {
        await runLocaleTransition(apply)
      } finally {
        transitioningRef.current = false
        setTransitioning(false)
      }
    },
    [activeLocale, hash, i18n, navigate, pathname, search],
  )

  const pathFor = useCallback((path = '/') => localizedPath(path, activeLocale), [activeLocale])

  return {
    locale: activeLocale,
    switchTo,
    transitioning,
    pathFor,
    contentPath: stripLocale(pathname),
    ogLocale: OG_LOCALE[activeLocale],
  }
}

/** Small helper shared by the data hooks. */
function useTranslator() {
  const { t } = useTranslation()
  return useMemo(() => (key, options) => t(key, options), [t])
}

export function useCompany() {
  const tr = useTranslator()
  return useMemo(() => localize(COMPANY, 'company', tr), [tr])
}

export function useMedia() {
  const tr = useTranslator()
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(MEDIA).map(([key, media]) => [
          key,
          media ? { ...media, alt: tr(media.alt, { ns: 'media' }) } : media,
        ]),
      ),
    [tr],
  )
}

export function useNavigation() {
  const tr = useTranslator()
  const company = useCompany()

  return useMemo(
    () => ({
      ROUTES,
      PRIMARY_NAV: localize(PRIMARY_NAV, 'navigation', tr),
      NAVBAR_LINKS: localize(NAVBAR_LINKS, 'navigation', tr),
      FOOTER_SERVICES: localize(FOOTER_SERVICES, 'navigation', tr),
      FOOTER_COMPANY: localize(FOOTER_COMPANY, 'navigation', tr),
      LEGAL_LINKS: localize(LEGAL_LINKS, 'navigation', tr),
      NOT_FOUND_META: localize(NOT_FOUND_META, 'navigation', tr),
      PAGE_META: localize(PAGE_META, 'navigation', tr),
      CONTACT_DETAILS: {
        ...CONTACT_DETAILS,
        phones: company.phones,
        locations: company.locations,
        addressLines: company.locations[0]?.lines ?? CONTACT_DETAILS.addressLines,
      },
      SOCIAL_LINKS,
    }),
    [company.locations, company.phones, tr],
  )
}

export function useHome() {
  const tr = useTranslator()
  return useMemo(() => localize(HOME, 'home', tr), [tr])
}

export function usePages() {
  const tr = useTranslator()
  return useMemo(
    () =>
      localize(
        { ABOUT, SOURCING, SUPPLY_CHAIN, LOGISTICS, NETWORK_PAGE },
        'pages',
        tr,
      ),
    [tr],
  )
}

export function useServices() {
  const tr = useTranslator()
  return useMemo(
    () => localize({ CAPABILITIES, PROCESS_STEPS, DIFFERENTIATORS, VALUES }, 'services', tr),
    [tr],
  )
}

export function useLegal() {
  const tr = useTranslator()
  return useMemo(
    () => localize({ LEGAL_DRAFT, PRIVACY, TERMS, LEGAL_CONTACT }, 'legal', tr),
    [tr],
  )
}

/**
 * Contact copy and fields. Select options keep their original values (the
 * server validates against the English service list) while their visible labels
 * are translated.
 */
export function useContact() {
  const tr = useTranslator()
  return useMemo(() => {
    const localizedFields = localize(CONTACT_FORM_FIELDS, 'contact', tr)
    const fields = localizedFields.map((field, index) => {
      const original = CONTACT_FORM_FIELDS[index]
      if (!original.options) return field
      return {
        ...field,
        options: original.options.map((value, optionIndex) => ({
          value,
          label: field.options[optionIndex],
        })),
      }
    })

    return {
      CONTACT_FORM_FIELDS: fields,
      CONTACT_FORM_COPY: localize(CONTACT_FORM_COPY, 'contact', tr),
    }
  }, [tr])
}

export function useScheduling() {
  const tr = useTranslator()
  return useMemo(
    () => ({
      copy: localize(SCHEDULE_COPY, 'scheduling', tr),
      CAL_LINK,
      CAL_PUBLIC_URL,
      DEFAULT_TIME_ZONE,
      IS_SCHEDULING_CONFIGURED,
      fallbackEmail: CONTACT_DETAILS.email,
      // DEFAULT_TIME_ZONE is the machine id (`Asia/Kabul`) used by Cal.com; the
      // visible label is the human-readable dictionary key.
      zoneLabel: tr(DEFAULT_TIME_ZONE_LABEL, { ns: 'scheduling' }),
    }),
    [tr],
  )
}

/** Absolute URL for a localized application path. */
export function useSiteUrl() {
  return useCallback((path = '/') => siteUrl(path), [])
}

export default useLocale
