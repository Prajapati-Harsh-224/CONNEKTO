import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { getRoleNavigation } from './navigation.js'
import { useLocale } from '../context/LocaleContext.jsx'
import { getCart } from '../utils/cartStorage.js'

export default function Sidebar({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const items = getRoleNavigation(role)
  const { t } = useLocale()
  const [cartCount, setCartCount] = useState(() => getCart().length)

  useEffect(() => {
    const refreshCartCount = () => setCartCount(getCart().length)
    window.addEventListener('connecto-cart-updated', refreshCartCount)
    window.addEventListener('storage', refreshCartCount)
    return () => {
      window.removeEventListener('connecto-cart-updated', refreshCartCount)
      window.removeEventListener('storage', refreshCartCount)
    }
  }, [])

  return (
    <aside className="sidebar" aria-label={t('workspace')}>
      <div className="sidebar-label">{t('workspace')}</div>
      {items.map((item) => {
        const badge = item.section === 'cart' ? String(cartCount || 0) : item.badge
        return (
          <NavLink
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
            end={item.section === 'home'}
            key={item.section}
            to={`/dashboard/${role}/${item.section}`}
          >
            <span>{t(item.key)}</span>
            {badge && Number(badge) > 0 ? <span className="nav-badge">{badge}</span> : null}
          </NavLink>
        )
      })}
    </aside>
  )
}
