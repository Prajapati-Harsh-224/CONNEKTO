import { NavLink, useParams } from 'react-router-dom'
import { FiHome, FiTruck, FiShoppingCart, FiFileText, FiPieChart, FiUsers, FiBox, FiMapPin, FiShoppingBag } from 'react-icons/fi'
import { getRoleNavigation } from './navigation.js'
import { useLocale } from '../context/LocaleContext.jsx'

function NavIcon({ section }) {
  const icons = {
    home: <FiHome />,
    dashboard: <FiHome />,
    suppliers: <FiTruck />,
    cart: <FiShoppingCart />,
    orders: <FiFileText />,
    analytics: <FiPieChart />,
    products: <FiBox />,
    'shop-owners': <FiShoppingBag />,
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-2 py-1.5 shadow-lg" aria-label={t('workspace')}>
      {items.map((item) => (
        <NavLink
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? (role === 'gruh-udyog' ? 'text-emerald-800 font-bold' : 'text-brand-orange font-bold') : 'text-slate-600 hover:text-slate-900'
            }`
          }
          end={item.section === 'home'}
          key={item.section}
          to={`/dashboard/${role}/${item.section}`}
        >
          <span className="text-base" aria-hidden="true">
            <NavIcon section={item.section} />
          </span>
          <span className="truncate max-w-[60px]">{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

