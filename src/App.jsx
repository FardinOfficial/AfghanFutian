import { Route, Routes } from 'react-router-dom'

import MainLayout from '@/layouts/MainLayout'
import AboutPage from '@/pages/AboutPage'
import ContactPage from '@/pages/ContactPage'
import GlobalNetworkPage from '@/pages/GlobalNetworkPage'
import Home from '@/pages/Home'
import Logistics from '@/pages/Logistics'
import NotFound from '@/pages/NotFound'
import Privacy from '@/pages/Privacy'
import SchedulePage from '@/pages/SchedulePage'
import Sourcing from '@/pages/Sourcing'
import SupplyChain from '@/pages/SupplyChain'
import Terms from '@/pages/Terms'
import { ROUTES } from '@/data/navigation'
import { LocaleNavigate } from '@/i18n/LocaleLink'

/** English path plus its Pashto and Dari equivalents. */
const localized = (path) =>
  path === '/'
    ? ['/', '/ps', '/ps/', '/fa', '/fa/']
    : [path, `/ps${path}`, `/fa${path}`]

/**
 * React Router v7 needs one string `path` per <Route>, so each localized URL is
 * registered as its own route pointing at the same page component. There is
 * still exactly one implementation of every page; the prefixes are alternate
 * URLs for it. Keys keep React and the route ranking stable.
 */
const pageRoutes = (paths, element) =>
  paths.map((path) => <Route key={path} path={path} element={element} />)

/**
 * Route table.
 *
 * Every page renders inside `MainLayout`, so the navbar, footer, smooth scroll
 * and cursor persist across navigations and only the page body swaps. Locale
 * prefixes are alternate URLs for the *same* page component, and switching
 * language never remounts it.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {pageRoutes(localized(ROUTES.home), <Home />)}
        {pageRoutes(localized(ROUTES.about), <AboutPage />)}
        {pageRoutes(localized(ROUTES.sourcing), <Sourcing />)}
        {pageRoutes(localized(ROUTES.supplyChain), <SupplyChain />)}
        {pageRoutes(localized(ROUTES.logistics), <Logistics />)}
        {pageRoutes(localized(ROUTES.globalNetwork), <GlobalNetworkPage />)}
        {pageRoutes(localized(ROUTES.schedule), <SchedulePage />)}
        {pageRoutes(localized(ROUTES.contact), <ContactPage />)}
        {pageRoutes(localized(ROUTES.privacy), <Privacy />)}
        {pageRoutes(localized(ROUTES.terms), <Terms />)}
        {/* Legacy / alias paths */}
        {pageRoutes(localized('/services'), <LocaleNavigate to={ROUTES.sourcing} replace />)}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
