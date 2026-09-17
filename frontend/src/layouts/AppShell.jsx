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
    <div className={`min-h-screen flex flex-col ${isWorkspace ? '' : 'bg-[#fbfaf8]'}`}>
      {!isWorkspace && (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link className="flex items-center gap-2.5 shrink-0" to="/" aria-label={t('connectoHome')}>
              <span className="w-8 h-8 rounded-full bg-[#f06535] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                C
              </span>
              <span className="flex flex-col">
                <span className="text-base font-bold text-slate-900 leading-tight">{messages.appName}</span>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline leading-none mt-0.5">{t('strongerLocalBusinesses')}</span>
              </span>
            </Link>
            {!isAuthPage && <Navbar />}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageSelector />
              <Link className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/60 transition-colors" to="/login">
                {t('signIn')}
              </Link>
              <Link className="px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#f06535] hover:bg-[#e05424] shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5" to="/role-selection">
                <span>{t('getStarted')}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      {!isWorkspace && !isShopOwnerSignup && !isSupplierSignup && !isGruhUdyogSignup && !isShopOwnerLogin && !isSupplierLogin && !isGruhUdyogLogin && !isForgotPassword && (
        <footer className="bg-slate-900 text-white border-t border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <Link className="flex items-center gap-2 font-bold text-base text-white" to="/" aria-label={t('connectoHome')}>
                  <span className="w-6 h-6 rounded-full bg-[#f06535] text-white flex items-center justify-center font-bold text-xs">C</span>
                  <span>{messages.appName}</span>
                </Link>
                <p className="text-xs text-slate-400 mt-1">{t('strongerLocalBusinesses')}</p>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400" aria-label="Footer navigation">
                <a href="#home" className="hover:text-white transition-colors" onClick={e => { e.preventDefault(); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('home')}</a>
                <a href="#about" className="hover:text-white transition-colors" onClick={e => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('about')}</a>
                <a href="#for-businesses" className="hover:text-white transition-colors" onClick={e => { e.preventDefault(); document.getElementById('for-businesses')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('forBusinesses')}</a>
                <a href="#how-it-works" className="hover:text-white transition-colors" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('howItWorks')}</a>
                <a href="#contact" className="hover:text-white transition-colors" onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('contact')}</a>
              </nav>
            </div>
            <div className="pt-6 text-center text-xs text-slate-500">
              <span>© 2026 Connekto · {t('prototypeFoundation')}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
