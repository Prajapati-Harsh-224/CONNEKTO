import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSelectedRole, saveSelectedRole } from '../utils/roleStorage.js'

const initialForm = { identifier: '', password: '' }

function validateForm(form) {
  const errors = {}
  if (!form.identifier.trim()) errors.identifier = 'Enter your email or phone number.'
  if (!form.password) errors.password = 'Enter your password.'
  return errors
}

export default function LoginPage() {
  const selectedRole = getSelectedRole()
  const navigate = useNavigate()
  const { signIn, signOut } = useAuth()
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
    const validationErrors = validateForm(form)
    setErrors(validationErrors)
    setRequestError('')
    setSuccessMessage('')
    if (Object.keys(validationErrors).length) return

    setIsSubmitting(true)
    try {
      const signedInUser = await signIn({
        emailOrPhone: form.identifier.trim(),
        password: form.password,
        role: selectedRole || undefined
      })

      // Safeguard: ensure user's actual role matches the selected role
      if (selectedRole && signedInUser?.role && signedInUser.role !== selectedRole) {
        await signOut()
        const roleLabels = {
          SHOP_OWNER: t('shopOwner'),
          SUPPLIER: t('supplier'),
          GRUH_UDYOG: t('gruhUdyog')
        }
        const actual = roleLabels[signedInUser.role] || signedInUser.role
        setRequestError(`This account is registered as ${actual}. Please select the ${actual} role to sign in.`)
        return
      }

      const effectiveRole = signedInUser?.role || selectedRole || 'SHOP_OWNER'
      saveSelectedRole(effectiveRole)
      navigate(effectiveRole === 'SHOP_OWNER' ? '/dashboard/shop-owner' : `/dashboard/${effectiveRole.toLowerCase().replaceAll('_', '-')}`)
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
      <div className="w-full max-w-md">
        {selectedRole !== 'SHOP_OWNER' && selectedRole !== 'SUPPLIER' && selectedRole !== 'GRUH_UDYOG' && (
          <div className="text-center mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#f06535] mb-1">{t('connectoAccount')}</div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102d45]">{t('welcomeBack')}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('signInToContinue')}</p>
          </div>
        )}

        <form
          className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 space-y-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && (
            <header className="text-center pb-3 border-b border-slate-100 flex flex-col items-center">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 ${currentTone.badge}`}>
                <span>{currentTone.icon}</span>
                <span>{t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog')}</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#102d45] tracking-tight">
                {t('shopOwnerLoginHeading')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t('shopOwnerLoginSubtitle')}
              </p>
              <Link className="text-xs font-medium text-[#f06535] hover:underline mt-2 inline-block" to="/role-selection">
                {t('changeRole')}
              </Link>
            </header>
          )}

          <div className="flex items-center justify-between text-xs bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500">{t('signingInAs')}:</span>
            <strong className="text-slate-800 font-semibold">
              {selectedRole ? t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : selectedRole === 'SUPPLIER' ? 'supplier' : 'gruhUdyog') : t('noRoleSelected')}
            </strong>
            <Link className="text-[#f06535] hover:underline font-medium" to="/role-selection">{t('changeRole')}</Link>
          </div>

          {errors.role && (
            <p className="p-3 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200" role="alert">
              {errors.role}
            </p>
          )}

          <FormField
            autoComplete="username"
            error={errors.identifier}
            label={selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG' ? t('emailOrPhoneNumber') : t('emailOrPhone')}
            name="identifier"
            onChange={updateField}
            placeholder={selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG' ? t('enterEmailOrPhone') : 'you@example.com or +91'}
            type="text"
            value={form.identifier}
          />

          <PasswordField
            error={errors.password}
            label={t('password')}
            onChange={updateField}
            placeholder={selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG' ? t('enterYourPassword') : undefined}
            value={form.password}
          />

          <div className="flex justify-end text-xs">
            <Link className="text-[#f06535] hover:underline font-medium" to="/forgot-password">
              {t('forgotPassword')}
            </Link>
          </div>

          {requestError && (
            <p className="p-3 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200" role="alert">
              {requestError}
            </p>
          )}

          {successMessage && (
            <p className="p-3 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200" role="status">
              {successMessage}
            </p>
          )}

          <button
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#f06535] hover:bg-[#e05424] shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            disabled={isSubmitting}
            type="submit"
          >
            <span>{isSubmitting ? t('signingIn') : t('signIn')}</span>
            {(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' || selectedRole === 'GRUH_UDYOG') && <span aria-hidden="true">→</span>}
          </button>

          <p className="text-center text-xs text-slate-500 pt-2">
            {t('newToConnecto')}{' '}
            <Link className="text-[#f06535] hover:underline font-semibold" to={`/signup${selectedRole ? `?role=${selectedRole}` : ''}`}>
              {t('createAccount')}
            </Link>
          </p>
        </form>
      </div>
    </section>
  )
}
