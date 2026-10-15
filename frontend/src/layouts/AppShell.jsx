import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { getSelectedRole } from '../utils/roleStorage.js'

export default function AppShell() {
  const { messages, t } = useLocale()
  const { pathname, search } = useLocation()

  const isWorkspace = pathname.startsWith('/dashboard/')
  const isAuthPage = pathname === '/signup' || pathname === '/login' || pathname === '/role-selection' || pathname === '/forgot-password' || pathname === '/register'
  const isSignupPage = pathname === '/signup' || pathname === '/register'
  const isNoScrollPage = false

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
  const isShopOwnerSignup = (pathname === '/signup' || pathname === '/register') && new URLSearchParams(search).get('role') === 'SHOP_OWNER'
  const isSupplierSignup = (pathname === '/signup' || pathname === '/register') && new URLSearchParams(search).get('role') === 'SUPPLIER'
  const isGruhUdyogSignup = (pathname === '/signup' || pathname === '/register') && new URLSearchParams(search).get('role') === 'GRUH_UDYOG'
  const isShopOwnerLogin = pathname === '/login' && getSelectedRole() === 'SHOP_OWNER'
  const isSupplierLogin = pathname === '/login' && getSelectedRole() === 'SUPPLIER'
  const isGruhUdyogLogin = pathname === '/login' && getSelectedRole() === 'GRUH_UDYOG'
  const isForgotPassword = pathname === '/forgot-password'
  const isRegister = pathname === '/register' || pathname === '/signup'
  const isRoleSelection = pathname === '/role-selection'
  const isSignInPage = pathname === '/login'

  const registerUrl =
    search && search.includes('role=')
      ? `/register${search}`
      : '/register'

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      {!isWorkspace && (
        <>
          <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
            <div className="max-w-7xl xl:max-w-[1360px] 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between gap-3 sm:gap-4">
              <Link className="flex items-center gap-2.5 shrink-0" to="/" aria-label={t('connectoHome')}>
                <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  C
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-bold text-slate-900 leading-tight">{messages.appName}</span>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline leading-none mt-0.5">{t('strongerLocalBusinesses')}</span>
                </span>
              </Link>
              {!isAuthPage ? (
                <Navbar />
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {(isSignInPage || isRoleSelection) && (
                    <Link
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs hover:shadow-sm active:scale-95 transition-all"
                      to={registerUrl}
                    >
                      <span>{t('signUp')}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                  {isRegister && (
                    <Link
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs hover:shadow-sm active:scale-95 transition-all"
                      to="/login"
                    >
                      <span>{t('signIn')}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </header>
          <div className="h-16 shrink-0" aria-hidden="true" />
        </>
      )}
      <main className={`flex-1 w-full ${isWorkspace ? 'h-full overflow-hidden' : ''}`}>
        <Outlet />
      </main>
      {!isWorkspace && !isAuthPage && (
        <Footer />
      )}
    </div>
  )
}
