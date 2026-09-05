import { Link, Outlet, useParams } from 'react-router-dom'
import MobileNavigation from '../components/MobileNavigation.jsx'
import Sidebar from '../components/Sidebar.jsx'
import LanguageSelector from '../components/LanguageSelector.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'

export default function RoleLayout({ role: routeRole }) {
  const { role: paramRole } = useParams()
  const role = routeRole || paramRole
  const { user } = useAuth()
  const { t, messages } = useLocale()
  const roleLabel = role === 'supplier' ? t('supplier') : role === 'gruh-udyog' ? t('gruhUdyog') : t('shopOwner')

  return (
    <div className="workspace-layout">
      <header className="workspace-header">
        <Link className="brand" to="/" aria-label={t('connectoHome')}>
          <span className="brand-mark">C</span>
          <span>{messages.appName}</span>
        </Link>
        <div className="workspace-actions">
          <div className="workspace-meta">
            <div className="workspace-identity">
              <span className="role-dot" aria-hidden="true" />
              <span>{roleLabel}</span>
            </div>
            <LanguageSelector />
          </div>
          <Link className="profile-icon-link" to={`/dashboard/${role}/profile`} aria-label={t('profile')} title={t('profile')}>
            <span aria-hidden="true">{(user?.name || '?').trim().slice(0, 1).toUpperCase()}</span>
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
