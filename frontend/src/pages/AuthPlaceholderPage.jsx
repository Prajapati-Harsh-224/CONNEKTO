import { Link, useLocation } from 'react-router-dom'
import { FiArrowRight, FiArrowLeft, FiKey } from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSelectedRole } from '../utils/roleStorage.js'

export default function AuthPlaceholderPage() {
  const location = useLocation()
  const isSignup = location.pathname === '/signup'
  const isForgotPassword = location.pathname === '/forgot-password'
  const { t } = useLocale()
  const roleKey = getSelectedRole()
  const roleLabel = roleKey ? t(roleKey === 'SHOP_OWNER' ? 'shopOwner' : roleKey === 'SUPPLIER' ? 'supplier' : 'gruhUdyog') : ''

  if (isForgotPassword) {
    return (
      <section className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-md space-y-6">
          <header className="space-y-2 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center border border-orange-200/60 shadow-xs mb-3">
              <FiKey className="w-6 h-6" />
            </div>
            {roleLabel && (
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-orange bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                {roleLabel}
              </span>
            )}
            <h1 className="text-2xl font-extrabold text-slate-900">{t('forgotPasswordHeading')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">{t('forgotPasswordSubtitle')}</p>
          </header>

          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <label className="block space-y-1.5 text-left">
              <span className="text-xs font-semibold text-slate-700">{t('emailOrPhoneNumber')} *</span>
              <input
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-xs transition-all"
                name="identifier"
                placeholder={t('enterEmailOrPhone')}
                type="text"
                required
              />
            </label>
            <button
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-brand-orange text-white hover:bg-orange-700 active:scale-95 transition-all shadow-xs"
              type="submit"
            >
              <span>{t('sendResetLink')}</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-orange transition-colors"
              to="/login"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>{t('backToSignIn')}</span>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto space-y-4">
      <div className="text-xs font-bold uppercase tracking-wider text-brand-orange">{isSignup ? t('createAccount') : t('welcomeBack')}</div>
      <h1 className="text-2xl font-extrabold text-slate-900">{isSignup ? t('signupFoundationReady') : t('loginFoundationReady')}</h1>
      <p className="text-sm text-slate-500">{t('authReservedMessage')}</p>
      <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
        <Link
          className="flex-1 inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold bg-brand-orange text-white hover:bg-orange-700 transition-all shadow-xs"
          to={isSignup ? '/login' : '/role-selection'}
        >
          {isSignup ? t('backToSignIn') : t('chooseRole')}
        </Link>
        <Link
          className="inline-flex items-center justify-center py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-brand-orange transition-colors"
          to="/forgot-password"
        >
          {t('forgotPasswordLink')}
        </Link>
      </div>
    </section>
  )
}
