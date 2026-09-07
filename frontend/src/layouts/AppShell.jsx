import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.jsx'
import Navbar from '../components/Navbar.jsx'
import LanguageSelector from '../components/LanguageSelector.jsx'
import { getSelectedRole } from '../utils/roleStorage.js'

export default function AppShell() {
  const { messages, t } = useLocale()
  const { pathname, search } = useLocation()

  const isWorkspace = pathname.startsWith('/dashboard/')
  const isAuthPage = pathname === '/signup' || pathname === '/login' || pathname === '/role-selection' || pathname === '/forgot-password'
  const isNoScrollPage = isAuthPage || pathname === '/'

  useEffect(() => {
    window.scrollTo(0, 0)
    if (isNoScrollPage) {
      document.documentElement.classList.add('auth-no-scroll')
      document.body.classList.add('auth-no-scroll')
    } else {
      document.documentElement.classList.remove('auth-no-scroll')
      document.body.classList.remove('auth-no-scroll')
    }
    return () => {
      document.documentElement.classList.remove('auth-no-scroll')
      document.body.classList.remove('auth-no-scroll')
    }
  }, [pathname, search, isNoScrollPage])
  const isShopOwnerSignup = pathname === '/signup' && new URLSearchParams(search).get('role') === 'SHOP_OWNER'
  const isSupplierSignup = pathname === '/signup' && new URLSearchParams(search).get('role') === 'SUPPLIER'
  const isGruhUdyogSignup = pathname === '/signup' && new URLSearchParams(search).get('role') === 'GRUH_UDYOG'
  const isShopOwnerLogin = pathname === '/login' && getSelectedRole() === 'SHOP_OWNER'
  const isSupplierLogin = pathname === '/login' && getSelectedRole() === 'SUPPLIER'
  const isGruhUdyogLogin = pathname === '/login' && getSelectedRole() === 'GRUH_UDYOG'
  const isForgotPassword = pathname === '/forgot-password'

  return (
    <div className={`app-shell${isWorkspace ? ' workspace-shell' : ''}`}>
      {!isWorkspace && (
        <header className="public-header">
          <div className="public-header-inner">
            <Link className="pub-brand" to="/" aria-label={t('connectoHome')}>
              <span className="pub-brand-mark">C</span>
              <span className="pub-brand-text">
                <span className="pub-brand-name">{messages.appName}</span>
                <span className="pub-brand-tagline">{t('strongerLocalBusinesses')}</span>
              </span>
            </Link>
            {!isAuthPage && <Navbar />}
            <div className="pub-header-right">
              <LanguageSelector />
              <Link className="pub-login-btn" to="/login">{t('signIn')}</Link>
              <Link className="pub-getstarted-btn" to="/role-selection">{t('getStarted')} →</Link>
            </div>
          </div>
        </header>
      )}
      <main className={isWorkspace ? 'workspace-page-content' : 'pub-page-content'}>
        <Outlet />
      </main>
      {!isWorkspace && !isShopOwnerSignup && !isSupplierSignup && !isGruhUdyogSignup && !isShopOwnerLogin && !isSupplierLogin && !isGruhUdyogLogin && !isForgotPassword && (
        <footer className="pub-footer">
          <div className="pub-footer-full">
            <div className="pub-footer-top">
              <div className="pub-footer-brand-col">
                <Link className="pub-footer-brand" to="/" aria-label={t('connectoHome')}>
                  <span className="pub-brand-mark pub-brand-mark--sm">C</span>
                  <span>{messages.appName}</span>
                </Link>
                <p className="pub-footer-tagline">{t('strongerLocalBusinesses')}</p>
              </div>
              <nav className="pub-footer-nav" aria-label="Footer navigation">
                <a href="#home" className="pub-footer-link" onClick={e => { e.preventDefault(); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('home')}</a>
                <a href="#about" className="pub-footer-link" onClick={e => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('about')}</a>
                <a href="#for-businesses" className="pub-footer-link" onClick={e => { e.preventDefault(); document.getElementById('for-businesses')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('forBusinesses')}</a>
                <a href="#how-it-works" className="pub-footer-link" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('howItWorks')}</a>
                <a href="#contact" className="pub-footer-link" onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('contact')}</a>
              </nav>
            </div>
            <div className="pub-footer-bottom">
              <span className="pub-footer-copy">© 2026 Connekto · {t('prototypeFoundation')}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
