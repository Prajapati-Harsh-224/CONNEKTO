import { useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { FiSearch, FiGlobe, FiBell } from 'react-icons/fi'
import MobileNavigation from '../components/MobileNavigation.jsx'
import Sidebar from '../components/Sidebar.jsx'
import LanguageSelector from '../components/LanguageSelector.jsx'
import NotificationDropdown from '../components/NotificationDropdown.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'

export default function RoleLayout({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const { user } = useAuth()
  const { t, messages } = useLocale()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const roleLabel = role === 'supplier' ? t('supplier') : role === 'gruh-udyog' ? t('gruhUdyog') : t('shopOwner')
  const displayName = user?.name || 'Shop Owner'
  const avatarInitial = displayName.trim().slice(0, 1).toUpperCase()

  return (
    <div className={`workspace-layout${role === 'shop-owner' ? ' shop-owner-layout' : ''}${role === 'supplier' ? ' supplier-layout' : ''}`}>
      <header className="workspace-header">
        <div className="workspace-header-brand">
          <Link className="brand" to="/" aria-label={t('connectoHome')}>
            <span className="brand-mark">C</span>
            <span>{messages.appName}</span>
          </Link>
        </div>

        {role !== 'supplier' && role !== 'shop-owner' ? (
          <div className="workspace-header-search">
            <span className="workspace-search-icon"><FiSearch size={18} /></span>
            <input aria-label={t('searchSuppliersOrders')} placeholder={t('searchSuppliersOrders')} type="text" />
          </div>
        ) : null}

        <div className="workspace-header-tools">
          <div className="workspace-language">
            <FiGlobe size={16} />
            <LanguageSelector />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="workspace-icon-button"
              type="button"
              aria-label={t('notifications') || 'Notifications'}
              onClick={() => setIsNotifOpen(prev => !prev)}
            >
              <FiBell size={18} />
              {unreadCount > 0 && <span className="workspace-notification-dot" aria-hidden="true" />}
            </button>
            <NotificationDropdown
              role={role}
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onUnreadChange={setUnreadCount}
            />
          </div>
          <Link className="workspace-user" to={`/dashboard/${role}/profile`} aria-label={`${displayName}, ${roleLabel}. ${t('profile')}`}>
            <span className="workspace-user-avatar" aria-hidden="true">{avatarInitial}</span>
            <div className="workspace-user-meta">
              <span className="workspace-user-name">{displayName}</span>
              <span className="workspace-user-role">{roleLabel}</span>
            </div>
          </Link>
        </div>
      </header>

      <div className="workspace-body">
        <Sidebar role={role} />
        <main className="workspace-content"><Outlet /></main>
      </div>
      <MobileNavigation role={role} />
    </div>
  )
}


