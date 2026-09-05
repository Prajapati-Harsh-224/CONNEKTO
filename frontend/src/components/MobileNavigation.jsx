import { NavLink, useParams } from 'react-router-dom'
import { getRoleNavigation } from './navigation.js'
import { useLocale } from '../context/LocaleContext.jsx'

export default function MobileNavigation({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const items = getRoleNavigation(role)
  const { t } = useLocale()

  return (
    <nav className="mobile-navigation" aria-label={t('workspace')}>
      {items.map((item) => (
        <NavLink className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'} end={item.section === 'home'} key={item.section} to={`/dashboard/${role}/${item.section}`}>
          <span className="mobile-link-icon" aria-hidden="true">{t(item.key).slice(0, 1)}</span>
          <span>{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
