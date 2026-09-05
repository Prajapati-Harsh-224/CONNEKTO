import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { register } from '../services/authService.js'
import { getSelectedRole, saveSelectedRole } from '../utils/roleStorage.js'

const roles = ['SHOP_OWNER', 'SUPPLIER', 'GRUH_UDYOG']
const initialForm = { name: '', gruhName: '', shopName: '', shopAddress: '', area: '', phone: '', email: '', identifier: '', password: '', confirmPassword: '' }

function validateForm(form, role, hasConsent) {
  const errors = {}
  if (!role || !roles.includes(role)) errors.role = 'Choose a role before creating your account.'
  if (!form.name.trim()) errors.name = 'Enter your full name.'
  if (role === 'SHOP_OWNER') {
    if (!form.shopName.trim()) errors.shopName = 'Enter your shop name.'
    if (!form.shopAddress.trim()) errors.shopAddress = 'Enter your shop address.'
    if (!form.area.trim()) errors.area = 'Enter your shop area.'
    if (!form.phone.trim()) errors.phone = 'Enter your phone number.'
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  } else {
    if (role === 'GRUH_UDYOG' && !form.gruhName.trim()) errors.gruhName = 'Enter your Gruh Udyog name.'
    if (!form.identifier.trim()) errors.identifier = 'Enter your email or phone number.'
  }
  if (form.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'
  if (!hasConsent) errors.consent = 'Please accept the terms to continue.'
  return errors
}

export default function SignupPage() {
  const [searchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role')
  const selectedRole = roles.includes(roleFromUrl) ? roleFromUrl : getSelectedRole()
  const { t } = useLocale()
  const [form, setForm] = useState(initialForm)
  const [hasConsent, setHasConsent] = useState(false)
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '', role: '', consent: '' }))
    setRequestError('')
    setSuccessMessage('')
  }

  function updateConsent(event) {
    setHasConsent(event.target.checked)
    setErrors((currentErrors) => ({ ...currentErrors, consent: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateForm(form, selectedRole, hasConsent)
    setErrors(validationErrors)
    setRequestError('')
    setSuccessMessage('')
    if (Object.keys(validationErrors).length) return

    saveSelectedRole(selectedRole)
    setIsSubmitting(true)
    try {
      const credentials = selectedRole === 'SHOP_OWNER'
        ? { name: form.name.trim(), shopName: form.shopName.trim(), shopAddress: form.shopAddress.trim(), area: form.area.trim(), phone: form.phone.trim(), email: form.email.trim(), password: form.password, role: selectedRole }
        : { name: form.name.trim(), identifier: form.identifier.trim(), password: form.password, role: selectedRole }
      await register(credentials)
      setSuccessMessage('Signup request completed. Your account setup will continue next.')
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`auth-page signup-page${selectedRole === 'SHOP_OWNER' ? ' signup-page--shop-owner' : ''}${selectedRole === 'SUPPLIER' ? ' signup-page--supplier' : ''}${selectedRole === 'GRUH_UDYOG' ? ' signup-page--gruh-udyog' : ''}`}>
      {selectedRole !== 'SHOP_OWNER' && selectedRole !== 'SUPPLIER' && selectedRole !== 'GRUH_UDYOG' && <div className="auth-intro">
        <div className="eyebrow">{t('createYourAccount')}</div>
        <h1>{t('startWithConnecto')}</h1>
        <p className="muted">{t('accountSetupDescription')}</p>
      </div>}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && <header className="signup-card-header">
          <span className="signup-role-icon" aria-hidden="true">{selectedRole === 'GRUH_UDYOG' ? '⌂' : '▦'}</span>
          <strong>{t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog')}</strong>
          <h1>{t(selectedRole === 'SHOP_OWNER' ? 'shopOwnerSignupHeading' : selectedRole === 'SUPPLIER' ? 'supplierSignupHeading' : 'gruhUdyogSignupHeading')}</h1>
          <p>{t(selectedRole === 'SHOP_OWNER' ? 'shopOwnerSignupSubtitle' : selectedRole === 'SUPPLIER' ? 'supplierSignupSubtitle' : 'gruhUdyogSignupSubtitle')}</p>
          <Link className="signup-card-change-role" to="/role-selection">{t('changeRole')}</Link>
        </header>}
        <div className={`selected-role${errors.role ? ' selected-role-error' : ''}`}>
          <span className="muted">{t('creatingAccountAs')}</span>
          <strong>{selectedRole ? t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog') : t('noRoleSelected')}</strong>
          <Link to="/role-selection">{t('changeRole')}</Link>
        </div>
        {errors.role && <p className="form-message error" role="alert">{errors.role}</p>}
        {selectedRole === 'SHOP_OWNER' ? <>
          <div className="signup-section"><h2>{t('businessInformation')}</h2><div className="signup-field-grid">
            <FormField autoComplete="name" error={errors.name} label={`${t('fullName')} *`} name="name" onChange={updateField} placeholder={t('userName')} type="text" value={form.name} />
            <FormField autoComplete="organization" error={errors.shopName} label={`${t('shopName')} *`} name="shopName" onChange={updateField} placeholder={t('shopName')} type="text" value={form.shopName} />
            <FormField autoComplete="street-address" error={errors.shopAddress} label={`${t('shopAddress')} *`} name="shopAddress" onChange={updateField} placeholder={t('shopAddress')} type="text" value={form.shopAddress} />
            <FormField autoComplete="address-level2" error={errors.area} label={`${t('area')} *`} name="area" onChange={updateField} placeholder={t('area')} type="text" value={form.area} />
          </div></div>
          <div className="signup-section"><h2>{t('contactInformation')}</h2><div className="signup-field-grid">
            <FormField autoComplete="tel" error={errors.phone} label={`${t('phoneNumber')} *`} name="phone" onChange={updateField} placeholder="+91 98765 43210" type="tel" value={form.phone} />
            <FormField autoComplete="email" error={errors.email} label={t('optionalEmail')} name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
          </div></div>
          <div className="signup-section"><h2>{t('security')}</h2><div className="signup-field-grid">
            <PasswordField autoComplete="new-password" error={errors.password} label={`${t('password')} *`} name="password" onChange={updateField} value={form.password} />
            <PasswordField autoComplete="new-password" error={errors.confirmPassword} label={`${t('confirmPassword')} *`} name="confirmPassword" onChange={updateField} value={form.confirmPassword} />
          </div></div>
        </> : selectedRole === 'SUPPLIER' ? <>
          <FormField autoComplete="name" error={errors.name} label={`${t('fullName')} *`} name="name" onChange={updateField} placeholder={t('userName')} type="text" value={form.name} />
          <FormField autoComplete="username" error={errors.identifier} label={`${t('emailOrPhoneNumber')} *`} name="identifier" onChange={updateField} placeholder={t('enterEmailOrPhone')} type="text" value={form.identifier} />
          <PasswordField autoComplete="new-password" error={errors.password} label={`${t('password')} *`} name="password" onChange={updateField} placeholder={t('enterYourPassword')} value={form.password} />
          <PasswordField autoComplete="new-password" error={errors.confirmPassword} label={`${t('confirmPassword')} *`} name="confirmPassword" onChange={updateField} placeholder={t('confirmPassword')} value={form.confirmPassword} />
        </> : <>
          <FormField autoComplete="organization" error={errors.gruhName} label={`${t('gruhUdyogName')} *`} name="gruhName" onChange={updateField} placeholder={t('enterGruhUdyogName')} type="text" value={form.gruhName} />
          <FormField autoComplete="name" error={errors.name} label={`${t('fullName')} *`} name="name" onChange={updateField} placeholder={t('userName')} type="text" value={form.name} />
          <FormField autoComplete="username" error={errors.identifier} label={`${t('emailOrPhoneNumber')} *`} name="identifier" onChange={updateField} placeholder={t('enterEmailOrPhone')} type="text" value={form.identifier} />
          <PasswordField autoComplete="new-password" error={errors.password} label={`${t('password')} *`} name="password" onChange={updateField} placeholder={t('enterYourPassword')} value={form.password} />
          <PasswordField autoComplete="new-password" error={errors.confirmPassword} label={`${t('confirmPassword')} *`} name="confirmPassword" onChange={updateField} placeholder={t('confirmPassword')} value={form.confirmPassword} />
        </>}
        <label className={`consent-field${errors.consent ? ' consent-error' : ''}`}>
          <input checked={hasConsent} onChange={updateConsent} type="checkbox" />
          <span>{t(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' ? 'shopOwnerTerms' : 'agreeToTerms')}</span>
        </label>
        {errors.consent && <p className="field-error consent-message" role="alert">{errors.consent}</p>}
        {requestError && <p className="form-message error" role="alert">{requestError}</p>}
        {successMessage && <p className="form-message success" role="status">{successMessage}</p>}
        <button className="button primary form-submit" disabled={isSubmitting} type="submit">{isSubmitting ? t('creatingAccount') : t('createAccount')} {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && <span aria-hidden="true">→</span>}</button>
        <p className="signup-prompt">{t('alreadyHaveAccount')} <Link to="/login">{t('signIn')}</Link></p>
      </form>
    </section>
  )
}
