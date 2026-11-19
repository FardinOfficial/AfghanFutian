import { Navigate, Route, Routes } from 'react-router-dom'

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

/**
 * Route table.
 *
 * Every page renders inside `MainLayout`, so the navbar, footer, smooth scroll
 * and cursor persist across navigations and only the page body swaps.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.about} element={<AboutPage />} />
        <Route path={ROUTES.sourcing} element={<Sourcing />} />
        <Route path={ROUTES.supplyChain} element={<SupplyChain />} />
        <Route path={ROUTES.logistics} element={<Logistics />} />
        <Route path={ROUTES.globalNetwork} element={<GlobalNetworkPage />} />
        <Route path={ROUTES.schedule} element={<SchedulePage />} />
        <Route path={ROUTES.contact} element={<ContactPage />} />
        <Route path={ROUTES.privacy} element={<Privacy />} />
        <Route path={ROUTES.terms} element={<Terms />} />
        {/* Legacy / alias paths */}
        <Route path="/services" element={<Navigate to={ROUTES.sourcing} replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
