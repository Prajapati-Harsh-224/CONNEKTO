import { Link, useLocation } from 'react-router-dom'
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
      <section className="auth-placeholder-page forgot-password-page">
        <div className="forgot-password-card">
          <header className="forgot-password-header">
            <span className="forgot-password-icon" aria-hidden="true">▣</span>
            {roleLabel && <strong>{roleLabel}</strong>}
            <h1>{t('forgotPasswordHeading')}</h1>
            <p>{t('forgotPasswordSubtitle')}</p>
          </header>
          <form className="forgot-password-form" onSubmit={(event) => event.preventDefault()}>
            <label className="forgot-password-field">
              <span>{t('emailOrPhoneNumber')} *</span>
              <input name="identifier" placeholder={t('enterEmailOrPhone')} type="text" />
            </label>
            <button className="button primary" type="submit">{t('sendResetLink')} <span aria-hidden="true">→</span></button>
          </form>
          <Link className="forgot-password-back" to="/login">← {t('backToSignIn')}</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="setup-page narrow">
      <div className="eyebrow">{isSignup ? t('createAccount') : t('welcomeBack')}</div>
      <h1>{isSignup ? t('signupFoundationReady') : t('loginFoundationReady')}</h1>
      <p className="muted">{t('authReservedMessage')}</p>
      <Link className="button primary" to={isSignup ? '/login' : '/role-selection'}>{isSignup ? t('backToSignIn') : t('chooseRole')}</Link>
      <Link className="text-link" to="/forgot-password">{t('forgotPasswordLink')}</Link>
    </section>
  )
}
