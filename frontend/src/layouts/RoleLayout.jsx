import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useParams, useLocation } from 'react-router-dom'
import { FiSearch, FiGlobe, FiBell } from 'react-icons/fi'
import MobileNavigation from '../components/MobileNavigation.jsx'
import Sidebar from '../components/Sidebar.jsx'
import LanguageSelector from '../components/LanguageSelector.jsx'
import NotificationDropdown from '../components/NotificationDropdown.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'

export default function RoleLayout({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = (routeRole || paramRole || '').replaceAll('_', '-')
  const { user } = useAuth()
  const { t, messages } = useLocale()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0)
    }
  }, [location.pathname])

  const roleLabel = role === 'supplier' ? t('supplier') : role === 'gruh-udyog' ? t('gruhUdyog') : t('shopOwner')
  const displayName = user?.name || 'Shop Owner'
  const avatarInitial = displayName.trim().slice(0, 1).toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-4">
          <Link className="flex items-center gap-2.5 shrink-0" to="/" aria-label={t('connectoHome')}>
            <span className="w-8 h-8 rounded-full bg-[#f06535] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              C
            </span>
            <span className="font-bold text-slate-900 text-lg tracking-tight hidden sm:inline">{messages.appName}</span>
          </Link>
        </div>

        {role !== 'supplier' && role !== 'shop-owner' && role !== 'gruh-udyog' ? (
          <div className="relative flex-1 max-w-md hidden md:flex items-center">
            <span className="absolute left-3 text-slate-400"><FiSearch size={16} /></span>
            <input
              aria-label={t('searchSuppliersOrders')}
              placeholder={t('searchSuppliersOrders')}
              type="text"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
            <FiGlobe size={15} className="text-slate-400" />
            <LanguageSelector />
          </div>

          <div className="relative">
            <button
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              type="button"
              aria-label={t('notifications') || 'Notifications'}
              onClick={() => setIsNotifOpen(prev => !prev)}
            >
              <FiBell size={18} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" aria-hidden="true" />}
            </button>
            <NotificationDropdown
              role={role}
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onUnreadChange={setUnreadCount}
            />
          </div>

          <Link className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-slate-100/60 transition-colors" to={`/dashboard/${role}/profile`} aria-label={`${displayName}, ${roleLabel}. ${t('profile')}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${role === 'gruh-udyog' ? 'bg-[#ea6a53] text-white' : 'bg-orange-100 text-[#f06535]'}`} aria-hidden="true">
              {avatarInitial}
            </span>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-800">{displayName}</span>
              <span className="text-[10px] text-slate-400 capitalize">{roleLabel}</span>
            </div>
          </Link>
        </div>
      </header>

      <div className="flex-1 w-full min-w-0 pt-16 md:pl-56 lg:pl-64">
        <Sidebar role={role} />
        <main ref={mainRef} className="w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNavigation role={role} />
    </div>
  )
}


