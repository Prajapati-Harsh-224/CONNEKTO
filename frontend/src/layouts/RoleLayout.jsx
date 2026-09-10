import { Link, Outlet, useParams } from 'react-router-dom'
import MobileNavigation from '../components/MobileNavigation.jsx'
import Sidebar from '../components/Sidebar.jsx'
import LanguageSelector from '../components/LanguageSelector.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'

function HeaderIcon({ name }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    location: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
  }

  return <svg aria-hidden="true" className={`workspace-svg-icon workspace-svg-icon-${name}`} fill="none" viewBox="0 0 24 24"><g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name]}</g></svg>
}

export default function RoleLayout({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const { user } = useAuth()
  const { t, messages } = useLocale()
  const roleLabel = role === 'supplier' ? t('supplier') : role === 'gruh-udyog' ? t('gruhUdyog') : t('shopOwner')
  const displayName = user?.name || 'Shop Owner'
  const avatarInitial = displayName.trim().slice(0, 1).toUpperCase()

  return (
    <div className={`workspace-layout${role === 'shop-owner' ? ' shop-owner-layout' : ''}`}>
      <header className="workspace-header">
        <div className="workspace-header-brand">
          <Link className="brand" to="/" aria-label={t('connectoHome')}>
            <span className="brand-mark">C</span>
            <span>{messages.appName}</span>
          </Link>
        </div>

        {role !== 'supplier' ? (
          <div className="workspace-header-search">
            <span className="workspace-search-icon"><HeaderIcon name="search" /></span>
            <input aria-label={t('searchSuppliersOrders')} placeholder={t('searchSuppliersOrders')} type="text" />
          </div>
        ) : null}

        <div className="workspace-header-tools">
          <div className="workspace-location">
            <HeaderIcon name="location" />
            <span>Ahmedabad</span>
          </div>
          <div className="workspace-language">
            <HeaderIcon name="globe" />
            <LanguageSelector />
          </div>
          <button className="workspace-icon-button" type="button" aria-label={t('notifications') || 'Notifications'}>
            <HeaderIcon name="bell" />
            <span className="workspace-notification-dot" aria-hidden="true" />
          </button>
          <Link className="workspace-user" to={`/dashboard/${role}/profile`} aria-label={`${displayName}, ${roleLabel}. ${t('profile')}`}>
            <span className="workspace-user-avatar" aria-hidden="true">{avatarInitial}</span>
            <div className="workspace-user-meta">
              <span className="workspace-user-name">{displayName}</span>
              <span className="workspace-user-role">{roleLabel}</span>
            </div>
            <span className="workspace-user-caret"><HeaderIcon name="chevron" /></span>
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
