import { Fragment, useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { FiHome, FiTruck, FiShoppingCart, FiFileText, FiPieChart, FiUsers, FiBox, FiMapPin } from 'react-icons/fi'
import { getRoleNavigation } from './navigation.js'
import { useLocale } from '../context/LocaleContext.jsx'
import { getCart } from '../utils/cartStorage.js'

function NavIcon({ section }) {
  const icons = {
    home: <FiHome style={{ marginRight: '8px' }} />,
    suppliers: <FiTruck style={{ marginRight: '8px' }} />,
    cart: <FiShoppingCart style={{ marginRight: '8px' }} />,
    orders: <FiFileText style={{ marginRight: '8px' }} />,
    analytics: <FiPieChart style={{ marginRight: '8px' }} />,
    products: <FiBox style={{ marginRight: '8px' }} />,
    customers: <FiUsers style={{ marginRight: '8px' }} />,
    'service-areas': <FiMapPin style={{ marginRight: '8px' }} />,
  }
  return icons[section] || null
}

export default function Sidebar({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const items = getRoleNavigation(role)
  const { t } = useLocale()
  const [cartCount, setCartCount] = useState(() => {
    return getCart().reduce((sum, item) => sum + Number(item.boxes || 1), 0)
  })

  useEffect(() => {
    const refreshCartCount = () => {
      setCartCount(getCart().reduce((sum, item) => sum + Number(item.boxes || 1), 0))
    }
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
        const showSupplierDivider = role === 'supplier' && item.section === 'customers'
        return (
          <Fragment key={item.section}>
            <NavLink
              className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
              end={item.section === 'home'}
              to={`/dashboard/${role}/${item.section}`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <NavIcon section={item.section} />
                {t(item.key)}
              </span>
              {badge && Number(badge) > 0 ? <span className="nav-badge">{badge}</span> : null}
            </NavLink>
            {showSupplierDivider ? <div className="sidebar-section-divider" aria-hidden="true" /> : null}
          </Fragment>
        )
      })}
    </aside>
  )
}

