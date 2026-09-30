import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { FiHome, FiTruck, FiShoppingCart, FiFileText, FiPieChart, FiUsers, FiBox, FiMapPin, FiShoppingBag } from 'react-icons/fi'
import { getRoleNavigation } from './navigation.js'
import { useLocale } from '../context/LocaleContext.jsx'
import { getCart } from '../utils/cartStorage.js'

function NavIcon({ section }) {
  const icons = {
    home: <FiHome size={18} />,
    dashboard: <FiHome size={18} />,
    suppliers: <FiTruck size={18} />,
    cart: <FiShoppingCart size={18} />,
    orders: <FiFileText size={18} />,
    analytics: <FiPieChart size={18} />,
    products: <FiBox size={18} />,
    'shop-owners': <FiShoppingBag size={18} />,
    customers: <FiUsers size={18} />,
    'service-areas': <FiMapPin size={18} />,
  }
  return icons[section] || null
}

export default function MobileNavigation({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const items = getRoleNavigation(role)
  const { t } = useLocale()

  const [cartCount, setCartCount] = useState(() => {
    return getCart().reduce((sum, item) => sum + Number(item.boxQuantity || item.boxes || 1), 0)
  })

  useEffect(() => {
    const refreshCartCount = () => {
      setCartCount(getCart().reduce((sum, item) => sum + Number(item.boxQuantity || item.boxes || 1), 0))
    }
    window.addEventListener('connecto-cart-updated', refreshCartCount)
    window.addEventListener('storage', refreshCartCount)
    return () => {
      window.removeEventListener('connecto-cart-updated', refreshCartCount)
      window.removeEventListener('storage', refreshCartCount)
    }
  }, [])

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transform-gpu translate-z-0 flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] select-none"
      aria-label={t('workspace')}
    >
      {items.map((item) => {
        const isCart = item.section === 'cart'
        const badgeValue = isCart ? cartCount : (item.badge ? Number(item.badge) : 0)

        return (
          <NavLink
            className={({ isActive }) =>
              `relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-brand-orange font-bold bg-brand-orange-light/80'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`
            }
            end={item.section === 'home'}
            key={item.section}
            to={`/dashboard/${role}/${item.section}`}
          >
            <div className="relative flex items-center justify-center">
              <span className="text-lg" aria-hidden="true">
                <NavIcon section={item.section} />
              </span>
              {badgeValue > 0 ? (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-brand-orange text-white flex items-center justify-center shadow-xs tabular-nums ring-1 ring-white">
                  {badgeValue > 99 ? '99+' : badgeValue}
                </span>
              ) : null}
            </div>
            <span className="truncate max-w-[64px] tracking-tight">{t(item.key)}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
