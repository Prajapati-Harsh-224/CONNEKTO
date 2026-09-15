import { NavLink, useParams } from 'react-router-dom'
import { FiHome, FiTruck, FiShoppingCart, FiFileText, FiPieChart, FiUsers, FiBox, FiMapPin } from 'react-icons/fi'
import { getRoleNavigation } from './navigation.js'
import { useLocale } from '../context/LocaleContext.jsx'

function NavIcon({ section }) {
  const icons = {
    home: <FiHome />,
    suppliers: <FiTruck />,
    cart: <FiShoppingCart />,
    orders: <FiFileText />,
    analytics: <FiPieChart />,
    products: <FiBox />,
    customers: <FiUsers />,
    'service-areas': <FiMapPin />,
  }
  return icons[section] || null
}

export default function MobileNavigation({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const items = getRoleNavigation(role)
  const { t } = useLocale()

  return (
    <nav className="mobile-navigation" aria-label={t('workspace')}>
      {items.map((item) => (
        <NavLink className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'} end={item.section === 'home'} key={item.section} to={`/dashboard/${role}/${item.section}`}>
          <span className="mobile-link-icon" aria-hidden="true"><NavIcon section={item.section} /></span>
          <span>{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

