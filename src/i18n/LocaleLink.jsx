import { forwardRef } from 'react'
import { Link, NavLink, Navigate } from 'react-router-dom'

import { localizedPath } from './routing'
import { useLocale } from './hooks'

/** Internal link that keeps the visitor inside their current locale. */
export const LocaleLink = forwardRef(function LocaleLink({ to, ...props }, ref) {
  const { locale } = useLocale()
  return <Link ref={ref} to={localizedPath(to, locale)} {...props} />
})

/** NavLink variant — active state keeps working because the whole path is prefixed. */
export const LocaleNavLink = forwardRef(function LocaleNavLink({ to, ...props }, ref) {
  const { locale } = useLocale()
  return <NavLink ref={ref} to={localizedPath(to, locale)} {...props} />
})

/** Redirect that honours the active locale. */
export function LocaleNavigate({ to, ...props }) {
  const { locale } = useLocale()
  return <Navigate to={localizedPath(to, locale)} {...props} />
}

export default LocaleLink
