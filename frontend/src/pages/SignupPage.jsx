import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import CategoryCombobox from '../components/CategoryCombobox.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { register } from '../services/authService.js'
import { getSelectedRole, saveSelectedRole } from '../utils/roleStorage.js'

const roles = ['SHOP_OWNER', 'SUPPLIER', 'GRUH_UDYOG']
const initialForm = { name: '', shopName: '', shopAddress: '', area: '', category: '', phone: '', email: '', password: '', confirmPassword: '' }

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
  } else if (role === 'SUPPLIER' || role === 'GRUH_UDYOG') {
    if (!form.area.trim()) errors.area = 'Enter your area.'
    if (!form.phone.trim()) errors.phone = 'Enter your phone number.'
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  }

  if (form.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'
  if (!hasConsent) errors.consent = 'Please accept the terms to continue.'
  return errors
}

export default function SignupPage() {
  const navigate = useNavigate()
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
        ? { name: form.name.trim(), shopName: form.shopName.trim(), shopAddress: form.shopAddress.trim(), area: form.area.trim(), phone: form.phone.trim(), email: form.email.trim(), password: form.password, confirmPassword: form.confirmPassword, role: selectedRole }
        : { name: form.name.trim(), area: form.area.trim(), category: form.category.trim(), serviceAreas: form.area.split(',').map((value) => value.trim()).filter(Boolean), phone: form.phone.trim(), email: form.email.trim(), password: form.password, confirmPassword: form.confirmPassword, role: selectedRole }
      await register(credentials)
      navigate('/login')
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleTone = {
    SHOP_OWNER: { badge: 'bg-orange-50 text-orange-600', icon: '▦' },
    SUPPLIER: { badge: 'bg-emerald-50 text-emerald-700', icon: '▰' },
    GRUH_UDYOG: { badge: 'bg-purple-50 text-purple-700', icon: '⌂' },
  }
  const currentTone = roleTone[selectedRole] || roleTone.SHOP_OWNER

  return (
    <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl">
        {selectedRole !== 'SHOP_OWNER' && selectedRole !== 'SUPPLIER' && selectedRole !== 'GRUH_UDYOG' && (
          <div className="text-center mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#f06535] mb-1">{t('createYourAccount')}</div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102d45]">{t('startWithConnecto')}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('accountSetupDescription')}</p>
          </div>
        )}

        <form className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 space-y-4" onSubmit={handleSubmit} noValidate>
          {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && (
            <header className="text-center pb-3 border-b border-slate-100 flex flex-col items-center">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 ${currentTone.badge}`}>
                <span>{currentTone.icon}</span>
                <span>{t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog')}</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#102d45] tracking-tight">
                {t(selectedRole === 'SHOP_OWNER' ? 'shopOwnerSignupHeading' : selectedRole === 'SUPPLIER' ? 'supplierSignupHeading' : 'gruhUdyogSignupHeading')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t(selectedRole === 'SHOP_OWNER' ? 'shopOwnerSignupSubtitle' : selectedRole === 'SUPPLIER' ? 'supplierSignupSubtitle' : 'gruhUdyogSignupSubtitle')}
              </p>
              <Link className="text-xs font-medium text-[#f06535] hover:underline mt-2 inline-block" to="/role-selection">
                {t('changeRole')}
              </Link>
            </header>
          )}

          <div className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border ${errors.role ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
            <span className="text-slate-500">{t('creatingAccountAs')}:</span>
            <strong className="text-slate-800 font-semibold">
              {selectedRole ? t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog') : t('noRoleSelected')}
            </strong>
            <Link className="text-[#f06535] hover:underline font-medium" to="/role-selection">{t('changeRole')}</Link>
          </div>

          {errors.role && <p className="p-3 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200" role="alert">{errors.role}</p>}

          {selectedRole === 'SHOP_OWNER' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField autoComplete="name" error={errors.name} label={`${t('fullName')} *`} name="name" onChange={updateField} placeholder={t('userName')} type="text" value={form.name} />
                <FormField autoComplete="organization" error={errors.shopName} label={`${t('shopName')} *`} name="shopName" onChange={updateField} placeholder={t('shopName')} type="text" value={form.shopName} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField autoComplete="street-address" error={errors.shopAddress} label={`${t('shopAddress')} *`} name="shopAddress" onChange={updateField} placeholder={t('shopAddress')} type="text" value={form.shopAddress} />
                <FormField autoComplete="address-level2" error={errors.area} label={`${t('area')} *`} name="area" onChange={updateField} placeholder={t('area')} type="text" value={form.area} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <FormField autoComplete="tel" error={errors.phone} label={`${t('phoneNumber')} *`} name="phone" onChange={updateField} placeholder="+91 98765 43210" type="tel" value={form.phone} />
                <FormField autoComplete="email" error={errors.email} label={t('optionalEmail')} name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <PasswordField autoComplete="new-password" error={errors.password} label={`${t('password')} *`} name="password" onChange={updateField} value={form.password} />
                <PasswordField autoComplete="new-password" error={errors.confirmPassword} label={`${t('confirmPassword')} *`} name="confirmPassword" onChange={updateField} value={form.confirmPassword} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField autoComplete="name" error={errors.name} label={`${t('fullName')} *`} name="name" onChange={updateField} placeholder={t('userName')} type="text" value={form.name} />
                <FormField autoComplete="address-level2" error={errors.area} label={`${t('area')} *`} name="area" onChange={updateField} placeholder={t('area')} type="text" value={form.area} />
              </div>
              <div>
                <CategoryCombobox error={errors.category} label="Category" name="category" onChange={updateField} placeholder="Select or search category..." value={form.category} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <FormField autoComplete="tel" error={errors.phone} label={`${t('phoneNumber')} *`} name="phone" onChange={updateField} placeholder="+91 98765 43210" type="tel" value={form.phone} />
                <FormField autoComplete="email" error={errors.email} label={t('optionalEmail')} name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <PasswordField autoComplete="new-password" error={errors.password} label={`${t('password')} *`} name="password" onChange={updateField} value={form.password} />
                <PasswordField autoComplete="new-password" error={errors.confirmPassword} label={`${t('confirmPassword')} *`} name="confirmPassword" onChange={updateField} value={form.confirmPassword} />
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-xs text-slate-600 pt-2 cursor-pointer select-none">
            <input checked={hasConsent} onChange={updateConsent} type="checkbox" className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
            <span>{t(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' ? 'shopOwnerTerms' : 'agreeToTerms')}</span>
          </label>
          {errors.consent && <p className="text-[11px] font-medium text-rose-600" role="alert">{errors.consent}</p>}
          {requestError && <p className="p-3 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200" role="alert">{requestError}</p>}
          {successMessage && <p className="p-3 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200" role="status">{successMessage}</p>}

          <button className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-[#f06535] hover:bg-[#e05424] shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2" disabled={isSubmitting} type="submit">
            <span>{isSubmitting ? t('creatingAccount') : t('createAccount')}</span>
            {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && <span aria-hidden="true">→</span>}
          </button>
          <p className="text-center text-xs text-slate-500 pt-2">{t('alreadyHaveAccount')} <Link className="text-[#f06535] hover:underline font-semibold" to="/login">{t('signIn')}</Link></p>
        </form>
      </div>
    </section>
  )
}
