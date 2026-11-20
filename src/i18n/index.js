import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import common from './locales/en/common.json'
import navigation from './locales/en/navigation.json'
import home from './locales/en/home.json'
import pages from './locales/en/pages.json'
import services from './locales/en/services.json'
import legal from './locales/en/legal.json'
import contact from './locales/en/contact.json'
import scheduling from './locales/en/scheduling.json'
import media from './locales/en/media.json'
import company from './locales/en/company.json'
import email from './locales/en/email.json'

import psCommon from './locales/ps/common.json'
import psNavigation from './locales/ps/navigation.json'
import psHome from './locales/ps/home.json'
import psPages from './locales/ps/pages.json'
import psServices from './locales/ps/services.json'
import psLegal from './locales/ps/legal.json'
import psContact from './locales/ps/contact.json'
import psScheduling from './locales/ps/scheduling.json'
import psMedia from './locales/ps/media.json'
import psCompany from './locales/ps/company.json'
import psEmail from './locales/ps/email.json'

import faCommon from './locales/fa-AF/common.json'
import faNavigation from './locales/fa-AF/navigation.json'
import faHome from './locales/fa-AF/home.json'
import faPages from './locales/fa-AF/pages.json'
import faServices from './locales/fa-AF/services.json'
import faLegal from './locales/fa-AF/legal.json'
import faContact from './locales/fa-AF/contact.json'
import faScheduling from './locales/fa-AF/scheduling.json'
import faMedia from './locales/fa-AF/media.json'
import faCompany from './locales/fa-AF/company.json'
import faEmail from './locales/fa-AF/email.json'

import { initialLocale } from './routing'

export const NAMESPACES = [
  'common',
  'navigation',
  'home',
  'pages',
  'services',
  'legal',
  'contact',
  'scheduling',
  'media',
  'company',
  'email',
]

const resources = {
  en: { common, navigation, home, pages, services, legal, contact, scheduling, media, company, email },
  ps: {
    common: psCommon,
    navigation: psNavigation,
    home: psHome,
    pages: psPages,
    services: psServices,
    legal: psLegal,
    contact: psContact,
    scheduling: psScheduling,
    media: psMedia,
    company: psCompany,
    email: psEmail,
  },
  'fa-AF': {
    common: faCommon,
    navigation: faNavigation,
    home: faHome,
    pages: faPages,
    services: faServices,
    legal: faLegal,
    contact: faContact,
    scheduling: faScheduling,
    media: faMedia,
    company: faCompany,
    email: faEmail,
  },
}

/**
 * Translation keys ARE the English source strings. This keeps the original
 * data modules free of key scaffolding: the localizer walks them and asks
 * i18next for a translation of each literal it finds. `keySeparator: false`
 * is essential — copy frequently contains full stops and colons.
 */
i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'ps', 'fa-AF'],
  ns: NAMESPACES,
  defaultNS: 'common',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
  parseMissingKeyHandler: (key) => key,
})

export default i18n
