import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getRoleLabel } from '../utils/roleLabels.js'
import { getSelectedRole } from '../utils/roleStorage.js'

const initialForm = { identifier: '', password: '' }

function validateForm(form, selectedRole) {
  const errors = {}
  if (!selectedRole) errors.role = 'Choose a role before signing in.'
  if (!form.identifier.trim()) errors.identifier = 'Enter your email or phone number.'
  if (!form.password) errors.password = 'Enter your password.'
  return errors
}

export default function LoginPage() {
  const selectedRole = getSelectedRole()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { t } = useLocale()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '', role: '' }))
    setRequestError('')
    setSuccessMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateForm(form, selectedRole)
    setErrors(validationErrors)
    setRequestError('')
    setSuccessMessage('')
    if (Object.keys(validationErrors).length) return

    setIsSubmitting(true)
    try {
      await signIn({ identifier: form.identifier.trim(), password: form.password, role: selectedRole })
      navigate(selectedRole === 'SHOP_OWNER' ? '/dashboard/shop-owner' : `/dashboard/${selectedRole.toLowerCase().replaceAll('_', '-')}`)
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`auth-page login-page${selectedRole === 'SHOP_OWNER' ? ' login-page--shop-owner' : ''}${selectedRole === 'SUPPLIER' ? ' login-page--supplier' : ''}${selectedRole === 'GRUH_UDYOG' ? ' login-page--gruh-udyog' : ''}`}>
      {selectedRole !== 'SHOP_OWNER' && selectedRole !== 'SUPPLIER' && selectedRole !== 'GRUH_UDYOG' && <div className="auth-intro">
        <div className="eyebrow">{t('connectoAccount')}</div>
        <h1>{t('welcomeBack')}</h1>
        <p className="muted">{t('signInToContinue')}</p>
      </div>}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && <header className="login-card-header">
          <span className="signup-role-icon" aria-hidden="true">{selectedRole === 'GRUH_UDYOG' ? '⌂' : '▦'}</span>
          <strong>{t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog')}</strong>
          <h1>{t('shopOwnerLoginHeading')}</h1>
          <p>{t('shopOwnerLoginSubtitle')}</p>
          <Link className="signup-card-change-role" to="/role-selection">{t('changeRole')}</Link>
        </header>}
        <div className={`selected-role${errors.role ? ' selected-role-error' : ''}`}>
          <span className="muted">{t('signingInAs')}</span>
          <strong>{selectedRole ? t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog') : t('noRoleSelected')}</strong>
          <Link to="/role-selection">{t('changeRole')}</Link>
        </div>
        {errors.role && <p className="form-message error" role="alert">{errors.role}</p>}
        <FormField autoComplete="username" error={errors.identifier} label={selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG' ? t('emailOrPhoneNumber') : t('emailOrPhone')} name="identifier" onChange={updateField} placeholder={selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG' ? t('enterEmailOrPhone') : 'you@example.com or +91'} type="text" value={form.identifier} />
        <PasswordField error={errors.password} label={t('password')} onChange={updateField} placeholder={selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG' ? t('enterYourPassword') : undefined} value={form.password} />
        <div className="form-links"><Link to="/forgot-password">{t('forgotPassword')}</Link></div>
        {requestError && <p className="form-message error" role="alert">{requestError}</p>}
        {successMessage && <p className="form-message success" role="status">{successMessage}</p>}
        <button className="button primary form-submit" disabled={isSubmitting} type="submit">{isSubmitting ? t('signingIn') : t('signIn')} {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && <span aria-hidden="true">→</span>}</button>
        <p className="signup-prompt">{t('newToConnecto')} <Link to={`/signup${selectedRole ? `?role=${selectedRole}` : ''}`}>{t('createAccount')}</Link></p>
      </form>
    </section>
  )
}
