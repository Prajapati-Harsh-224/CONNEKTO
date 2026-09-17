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
    <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-slate-200/70 bg-white sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 space-y-1 shrink-0 self-start z-30" aria-label={t('workspace')}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">{t('workspace')}</div>
      {items.map((item) => {
        const badge = item.section === 'cart' ? String(cartCount || 0) : item.badge
        const showSupplierDivider = role === 'supplier' && item.section === 'customers'
        return (
          <Fragment key={item.section}>
            <NavLink
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? (role === 'gruh-udyog' ? 'bg-[#eaf5ef] text-[#1b6442] font-semibold' : 'bg-orange-50 text-[#f06535] font-semibold')
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
              end={item.section === 'home'}
              to={`/dashboard/${role}/${item.section}`}
            >
              <span className="inline-flex items-center">
                <NavIcon section={item.section} />
                {t(item.key)}
              </span>
              {badge && Number(badge) > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f06535] text-white tabular-nums">
                  {badge}
                </span>
              ) : null}
            </NavLink>
            {showSupplierDivider ? <div className="h-px bg-slate-100 my-2" aria-hidden="true" /> : null}
          </Fragment>
        )
      })}
      <div className="mt-auto pt-6 px-2 pb-2 flex items-start gap-3 border-t border-slate-100/80">
        <div className="w-8 h-8 rounded-lg bg-[#eaf5ef] text-[#1b6442] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800 leading-tight">Supporting Local Businesses</div>
          <div className="text-[11px] text-slate-400 mt-1 leading-snug">Handmade today for a better tomorrow.</div>
        </div>
      </div>
    </aside>
  )
}

