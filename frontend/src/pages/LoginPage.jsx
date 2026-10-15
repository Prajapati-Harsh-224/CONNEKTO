import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import CategoryCombobox from '../components/CategoryCombobox.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { checkIdentifier, register } from '../services/authService.js'
import { getAuthStateConfig } from '../utils/authUxState.js'
import { getSelectedRole, saveSelectedRole } from '../utils/roleStorage.js'

const validRoles = ['SHOP_OWNER', 'SUPPLIER']

const initialForm = {
  identifier: '',
  password: '',
  confirmPassword: '',
  name: '',
  shopName: '',
  shopAddress: '',
  area: '',
  category: '',
  phone: '',
  email: '',
}

function isEmailIdentifier(val) {
  return /^\S+@\S+\.\S+$/.test(val.trim())
}

function getRoleDashboardPath(role) {
  if (role === 'SHOP_OWNER') return '/dashboard/shop-owner'
  if (role === 'SUPPLIER') return '/dashboard/supplier'
  return '/dashboard/shop-owner'
}

function getRoleMismatchAlertMessage(actualRole) {
  const normalized = (actualRole || '').toUpperCase()
  if (normalized === 'SHOP_OWNER') {
    return 'you are a shopowner change role and then sign in'
  }
  if (normalized === 'SUPPLIER') {
    return 'you are a supplier change role and then sign in'
  }
  return 'you are registered with a different role. change role and then sign in'
}

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role')
  const selectedRole = validRoles.includes(roleFromUrl) ? roleFromUrl : (getSelectedRole() || 'SHOP_OWNER')
  const isRegisteredSuccess = searchParams.get('registered') === 'true'
  const navigate = useNavigate()
  const { user, signIn, signOut, updateUser } = useAuth()
  const { t } = useLocale()

  const [form, setForm] = useState(initialForm)
  const [hasConsent, setHasConsent] = useState(false)
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roleMismatchAlert, setRoleMismatchAlert] = useState(null)

  // Auth state tracking for Identifier-First flow
  const [formStep, setFormStep] = useState(1)
  const [authStatus, setAuthStatus] = useState('INITIAL') // 'INITIAL' | 'USER_FOUND' | 'USER_NOT_FOUND'

  // If user is already authenticated, redirect to their respective dashboard if current role matches
  useEffect(() => {
    if (user?.role) {
      if (!roleFromUrl || roleFromUrl === user.role) {
        saveSelectedRole(user.role)
        navigate(getRoleDashboardPath(user.role), { replace: true })
      }
    }
  }, [user, roleFromUrl, navigate])

  useEffect(() => {
    if (roleFromUrl && validRoles.includes(roleFromUrl)) {
      saveSelectedRole(roleFromUrl)
    }
  }, [roleFromUrl])

  // Compute UX copy and field visibility from auth state manager
  const authConfig = getAuthStateConfig(
    {
      status: authStatus,
      formStep,
      showExtraFields: formStep === 2,
    },
    selectedRole
  )

  function handleRoleMismatch(error) {
    const details = error?.details || {}
    let actualRole = details.actualRole
    if (!actualRole) {
      const raw = (error?.message || '').toLowerCase()
      if (raw.includes('shop owner') || raw.includes('shopowner')) actualRole = 'SHOP_OWNER'
      else if (raw.includes('supplier')) actualRole = 'SUPPLIER'
    }

    const alertText = details.alertMessage || getRoleMismatchAlertMessage(actualRole)
    setRoleMismatchAlert({
      message: alertText,
      actualRole: actualRole || 'SHOP_OWNER',
    })
    setRequestError(alertText)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '', role: '', consent: '' }))
    setRequestError('')
    setSuccessMessage('')
    setRoleMismatchAlert(null)
  }

  function updateConsent(event) {
    setHasConsent(event.target.checked)
    setErrors((currentErrors) => ({ ...currentErrors, consent: '' }))
  }

  function handleSwitchToStep1() {
    setFormStep(1)
    setAuthStatus('INITIAL')
    setErrors({})
    setRequestError('')
    setRoleMismatchAlert(null)
  }


  async function handleIdentifierCheckOrSignIn(event) {
    event.preventDefault()
    setRequestError('')
    setSuccessMessage('')

    const identifierVal = form.identifier.trim()
    if (!identifierVal) {
      setErrors({ identifier: 'Enter your email or phone number.' })
      return
    }

    // If password is NOT entered yet, perform the identifier check
    if (!form.password) {
      setIsSubmitting(true)
      try {
        const checkRes = await checkIdentifier(identifierVal, selectedRole)
        const checkData = checkRes?.data || {}

        if (!checkData.exists || checkData.status === 'USER_NOT_FOUND') {
          // Unregistered user -> redirect to register page with welcome message!
          navigate(`/register?role=${selectedRole}&reason=not_found&identifier=${encodeURIComponent(identifierVal)}`)
          return
        } else {
          // User exists: prompt to enter password
          setAuthStatus('USER_FOUND')
          setErrors({ password: 'Enter your password to sign in.' })
          return
        }
      } catch (error) {
        if (
          error.code === 'ROLE_MISMATCH' ||
          error.status === 403 ||
          (error.message && (error.message.toLowerCase().includes('change role') || error.message.toLowerCase().includes('registered as')))
        ) {
          handleRoleMismatch(error)
        } else {
          setRequestError(error.message || 'Unable to verify account details.')
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Password is provided -> attempt full sign in
    setIsSubmitting(true)
    try {
      const signedInUser = await signIn({
        emailOrPhone: identifierVal,
        password: form.password,
        role: selectedRole,
      })

      const effectiveRole = signedInUser?.role || selectedRole || 'SHOP_OWNER'
      saveSelectedRole(effectiveRole)
      navigate(getRoleDashboardPath(effectiveRole))
      return
    } catch (error) {
      const msg = error.message || ''
      if (
        error.code === 'ROLE_MISMATCH' ||
        error.status === 403 ||
        msg.toLowerCase().includes('change role') ||
        msg.toLowerCase().includes('registered as')
      ) {
        handleRoleMismatch(error)
        return
      }
      if (
        msg.toLowerCase().includes("couldn't find") ||
        msg.toLowerCase().includes('register') ||
        error.code === 'USER_NOT_FOUND' ||
        error.status === 404
      ) {
        // User does not exist -> redirect to register page with welcome message!
        navigate(`/register?role=${selectedRole}&reason=not_found&identifier=${encodeURIComponent(identifierVal)}`)
        return
      } else if (error.code === 'INVALID_CREDENTIALS' || error.status === 401) {
        setRequestError('The sign-in details are not valid.')
      } else {
        setRequestError(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCompleteRegistration(event) {
    event.preventDefault()
    setRequestError('')
    setSuccessMessage('')

    const validationErrors = {}
    if (!form.name.trim()) validationErrors.name = 'Enter your full name.'

    const phoneVal = form.phone.trim() || (!isEmailIdentifier(form.identifier) ? form.identifier.trim() : '')
    const emailVal = form.email.trim() || (isEmailIdentifier(form.identifier) ? form.identifier.trim() : '')

    if (!phoneVal) {
      validationErrors.phone = 'Enter your phone number.'
    } else if (phoneVal.replace(/\D/g, '').length < 8) {
      validationErrors.phone = 'Enter a valid phone number.'
    }

    if (emailVal && !isEmailIdentifier(emailVal)) {
      validationErrors.email = 'Enter a valid email address.'
    }

    if (selectedRole === 'SHOP_OWNER') {
      if (!form.shopName.trim()) validationErrors.shopName = 'Enter your shop name.'
      if (!form.shopAddress.trim()) validationErrors.shopAddress = 'Enter your shop address.'
      if (!form.area.trim()) validationErrors.area = 'Enter your shop area.'
    } else {
      if (!form.area.trim()) validationErrors.area = 'Enter your area.'
    }

    if (!form.password || form.password.length < 8) {
      validationErrors.password = 'Use at least 8 characters.'
    }
    if (form.confirmPassword !== form.password) {
      validationErrors.confirmPassword = 'Passwords do not match.'
    }
    if (!hasConsent) {
      validationErrors.consent = 'Please accept the terms to continue.'
    }

    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const credentials = selectedRole === 'SHOP_OWNER'
        ? {
            name: form.name.trim(),
            shopName: form.shopName.trim(),
            shopAddress: form.shopAddress.trim(),
            area: form.area.trim(),
            phone: phoneVal,
            email: emailVal,
            password: form.password,
            confirmPassword: form.confirmPassword,
            role: selectedRole,
          }
        : {
            name: form.name.trim(),
            area: form.area.trim(),
            category: form.category.trim() || 'FMCG',
            serviceAreas: form.area.split(',').map((v) => v.trim()).filter(Boolean),
            phone: phoneVal,
            email: emailVal,
            password: form.password,
            confirmPassword: form.confirmPassword,
            role: selectedRole,
          }

      const response = await register(credentials)
      const registeredUser = response?.data?.user

      if (registeredUser) {
        updateUser(registeredUser)
      }

      saveSelectedRole(selectedRole)
      navigate(getRoleDashboardPath(selectedRole))
    } catch (error) {
      setRequestError(error.message || 'Registration could not be completed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleTone = {
    SHOP_OWNER: { badge: 'bg-brand-orange-light text-brand-orange-dark font-bold', icon: '▦' },
    SUPPLIER: { badge: 'bg-emerald-50 text-emerald-800 font-bold', icon: '▰' },
  }
  const currentTone = roleTone[selectedRole] || roleTone.SHOP_OWNER

  return (
    <section className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 pb-24 sm:pb-32 overflow-y-auto no-scrollbar">
      <div className={`w-full transition-all duration-300 ${authConfig.showExtraFields ? 'max-w-xl' : 'max-w-md'} my-auto`}>
        <form
          className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 space-y-4"
          onSubmit={authConfig.showExtraFields ? handleCompleteRegistration : handleIdentifierCheckOrSignIn}
          noValidate
        >
          {/* Role Header Badge & Heading */}
          <header className="text-center pb-3 border-b border-slate-100 flex flex-col items-center">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 ${currentTone.badge}`}>
              <span>{currentTone.icon}</span>
              <span>{t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : 'supplier')}</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-brand-navy tracking-tight">
              {authConfig.heading}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {authConfig.subheading}
            </p>
          </header>

          {isRegisteredSuccess && !requestError && (
            <div className="p-3.5 rounded-xl text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-2" role="status">
              <span>✓ Registration completed! Please sign in with your credentials.</span>
            </div>
          )}

          {/* Role pill indicator */}
          <div className="flex items-center justify-between text-xs bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500">
              {authConfig.showExtraFields ? t('creatingAccountAs') : t('signingInAs')}:
            </span>
            <strong className="text-slate-800 font-semibold">
              {t(selectedRole === 'SHOP_OWNER' ? 'shopOwner' : 'supplier')}
            </strong>
            <button
              type="button"
              onClick={() => navigate(`/role-selection${selectedRole ? `?role=${selectedRole}` : ''}`)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {t('changeRole')}
            </button>
          </div>

          {errors.role && (
            <p className="p-3 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200" role="alert">
              {errors.role}
            </p>
          )}

          {/* STEP 1: Identifier Input */}
          {!authConfig.showExtraFields ? (
            <div className="space-y-4">
              <FormField
                autoComplete="username"
                error={errors.identifier}
                label={t('emailOrPhoneNumber')}
                name="identifier"
                onChange={updateField}
                placeholder={t('enterEmailOrPhone')}
                type="text"
                value={form.identifier}
              />

              {/* Password field shown when user already typed it or account found */}
              <PasswordField
                error={errors.password}
                label={t('password')}
                onChange={updateField}
                placeholder={t('enterYourPassword')}
                value={form.password}
              />

              <div className="flex justify-end text-xs">
                <Link className="text-brand-orange hover:text-brand-orange-dark hover:underline font-medium" to="/forgot-password">
                  {t('forgotPassword')}
                </Link>
              </div>
            </div>
          ) : (
            /* STEP 2: Inline Expanded Registration Profile */
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs bg-brand-orange-light border border-brand-orange/20 px-3.5 py-2.5 rounded-xl text-slate-800">
                <span>Account setup for <strong>{form.identifier || form.email || form.phone}</strong></span>
                <button
                  type="button"
                  onClick={handleSwitchToStep1}
                  className="text-brand-orange hover:text-brand-orange-dark font-semibold hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {selectedRole === 'SHOP_OWNER' ? (
                <div className="space-y-3.5">
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
                <div className="space-y-3.5">
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
                <input
                  checked={hasConsent}
                  onChange={updateConsent}
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span>{t(selectedRole === 'SHOP_OWNER' || selectedRole === 'SUPPLIER' ? 'shopOwnerTerms' : 'agreeToTerms')}</span>
              </label>
              {errors.consent && <p className="text-[11px] font-medium text-rose-600" role="alert">{errors.consent}</p>}
            </div>
          )}

          {requestError && (
            <div className="p-3.5 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" role="alert">
              <span>{requestError}</span>
              {(requestError.toLowerCase().includes('registered as') || requestError.toLowerCase().includes('change role')) && (
                <Link
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold text-xs shrink-0 transition-colors shadow-xs"
                  to={`/role-selection`}
                >
                  <span>Change Role</span>
                  <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              )}
            </div>
          )}

          {successMessage && (
            <p className="p-3 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200" role="status">
              {successMessage}
            </p>
          )}

          <button
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-brand-orange hover:bg-brand-orange-dark shadow-md shadow-brand-orange/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            disabled={isSubmitting}
            type="submit"
          >
            <span>{isSubmitting ? 'Please wait...' : authConfig.buttonText}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>

      {/* Role Mismatch Alert Box Modal */}
      {roleMismatchAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-alert-modal-title"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-amber-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 id="role-alert-modal-title" className="text-base font-bold text-slate-900">
                  Role Mismatch Alert
                </h3>
                <p className="text-xs text-slate-500">
                  Account registered with a different role
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm font-semibold leading-relaxed">
              "{roleMismatchAlert.message}"
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-orange/20 transition-all cursor-pointer text-center inline-flex items-center justify-center"
                onClick={() => {
                  const targetRole = roleMismatchAlert.actualRole || 'SHOP_OWNER'
                  saveSelectedRole(targetRole)
                  setRoleMismatchAlert(null)
                  navigate(`/login?role=${targetRole}`)
                }}
              >
                Change Role to {roleMismatchAlert.actualRole === 'SHOP_OWNER' ? 'Shop Owner' : 'Supplier'} →
              </button>
              <button
                type="button"
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                onClick={() => setRoleMismatchAlert(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
