import { NavLink, useParams } from 'react-router-dom'
import { getRoleNavigation } from './navigation.js'
import { useLocale } from '../context/LocaleContext.jsx'

export default function Sidebar({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const items = getRoleNavigation(role)
  const { t } = useLocale()

  return (
    <aside className="sidebar" aria-label={t('workspace')}>
      <div className="sidebar-label">{t('workspace')}</div>
      {items.map((item) => (
        <NavLink
          className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          end={item.section === 'home'}
          key={item.section}
          to={`/dashboard/${role}/${item.section}`}
        >
          <span>{t(item.key)}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </NavLink>
      ))}
    </aside>
  )
}
