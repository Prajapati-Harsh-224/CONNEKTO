import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiMail,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiLogOut,
  FiUser,
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronDown,
  FiPlus,
  FiTag,
  FiCheckCircle,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { updateProfile } from '../services/authService.js'

const roleKeys = {
  'shop-owner': 'shopOwner',
  supplier: 'supplier',
  'gruh-udyog': 'gruhUdyog',
}

const AVAILABLE_CATEGORIES = [
  'FMCG',
  'Grocery & Staples',
  'Beverages',
  'Personal Care',
  'Cleaning & Household',
  'Dairy & Bakery',
  'Snacks & Packaged Foods',
  'Local Manufacturers',
]

const POPULAR_AREAS = [
  'Maninagar',
  'Bapunagar',
  'Bopal',
  'Satellite',
  'Vastrapur',
  'Navrangpura',
  'Prahlad Nagar',
  'SG Highway',
]

export default function ProfilePage({ role }) {
  const navigate = useNavigate()
  const { user, signOut, updateUser } = useAuth()
  const { t } = useLocale()
  const roleLabel = t(roleKeys[role] || 'profile')
  const isShopOwner = role === 'shop-owner'
  const isSupplierLike = role === 'supplier' || role === 'gruh-udyog'

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Edit form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAreaInput, setFormAreaInput] = useState('')
  const [formServiceAreas, setFormServiceAreas] = useState([])
  const [formCategories, setFormCategories] = useState([])
  const [formShopName, setFormShopName] = useState('')
  const [formShopAddress, setFormShopAddress] = useState('')

  // Multi-category dropdown open state
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef(null)

  // Initialize form from current user
  const initForm = () => {
    if (!user) return
    setFormName(user.name || '')
    setFormEmail(user.email || user.supplier?.email || '')
    setFormPhone(user.phone || user.supplier?.phone || '')

    // Service areas
    const supplierAreas =
      user?.supplier?.serviceAreas?.length > 0
        ? user.supplier.serviceAreas
        : user?.serviceAreas?.length > 0
        ? user.serviceAreas
        : user?.area
        ? user.area
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
        : []
    setFormServiceAreas(supplierAreas)

    // Categories
    const supplierCats =
      user?.supplier?.categories?.length > 0
        ? user.supplier.categories
        : user?.categories?.length > 0
        ? user.categories
        : user?.supplier?.category
        ? user.supplier.category
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean)
        : []
    setFormCategories(supplierCats.length > 0 ? supplierCats : ['FMCG'])

    // Shop info
    setFormShopName(user.shop?.name || '')
    setFormShopAddress(user.shop?.address || '')
    setFormAreaInput('')
    setErrorMessage('')
    setFieldErrors({})
  }

  // Click outside listener for category dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleStartEdit() {
    initForm()
    setFeedback('')
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setErrorMessage('')
    setFieldErrors({})
  }

  function toggleCategory(cat) {
    setFormCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  function addServiceArea(areaToAdd) {
    const trimmed = (typeof areaToAdd === 'string' ? areaToAdd : formAreaInput).trim()
    if (!trimmed) return
    const parts = trimmed
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    setFormServiceAreas((prev) => {
      const next = [...prev]
      for (const part of parts) {
        if (!next.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
          next.push(part)
        }
      }
      return next
    })
    if (typeof areaToAdd !== 'string' || areaToAdd === formAreaInput) {
      setFormAreaInput('')
    }
  }

  function removeServiceArea(areaToRemove) {
    setFormServiceAreas((prev) =>
      prev.filter((a) => a.toLowerCase() !== areaToRemove.toLowerCase())
    )
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setFieldErrors({})
    setFeedback('')

    try {
      let finalServiceAreas = [...formServiceAreas]
      if (formAreaInput.trim()) {
        const parts = formAreaInput
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
        for (const part of parts) {
          if (!finalServiceAreas.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
            finalServiceAreas.push(part)
          }
        }
      }

      const payload = {
        name: formName.trim(),
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        area: isSupplierLike
          ? (finalServiceAreas.join(', ') || undefined)
          : (finalServiceAreas[0] || formAreaInput.trim() || undefined),
        serviceAreas: finalServiceAreas.length > 0 ? finalServiceAreas : undefined,
        categories: formCategories.length > 0 ? formCategories : undefined,
        shopName: isShopOwner ? formShopName.trim() || undefined : undefined,
        shopAddress: isShopOwner ? formShopAddress.trim() || undefined : undefined,
      }

      const response = await updateProfile(payload)
      const updatedUser = response?.data?.user

      if (updatedUser) {
        updateUser(updatedUser)
      }

      setFormServiceAreas(finalServiceAreas)
      setFormAreaInput('')
      setFeedback(t('profileUpdated') || 'Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.')
      if (err.details) {
        setFieldErrors(err.details)
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const contactPhone = user?.phone || user?.supplier?.phone || '-'
  const contactEmail = user?.email || user?.supplier?.email || '-'
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'

  // Areas to display in view mode
  const displayAreas =
    user?.supplier?.serviceAreas?.length > 0
      ? user.supplier.serviceAreas
      : user?.serviceAreas?.length > 0
      ? user.serviceAreas
      : user?.area
      ? user.area
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      : []

  // Categories to display in view mode
  const displayCategories =
    user?.supplier?.categories?.length > 0
      ? user.supplier.categories
      : user?.categories?.length > 0
      ? user.categories
      : user?.supplier?.category
      ? user.supplier.category
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : []

  return (
    <section className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-1">
            {roleLabel}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('profile')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('profileDescription')}</p>
        </div>

        {!isEditing && (
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-orange text-white hover:bg-orange-700 active:scale-95 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            onClick={handleStartEdit}
            type="button"
          >
            <FiEdit2 className="w-4 h-4" />
            <span>{t('editProfile') || 'Edit Profile'}</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {feedback && (
        <div
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs"
          role="status"
        >
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer ml-4"
            onClick={() => setFeedback('')}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center justify-between shadow-xs"
          role="alert"
        >
          <span>{errorMessage}</span>
          <button
            className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer ml-4"
            onClick={() => setErrorMessage('')}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* EDIT MODE */}
      {isEditing ? (
        <form
          className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
          onSubmit={handleSaveProfile}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange block">
                {t('updateAccount') || 'Update Account'}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{t('editProfileDetails') || 'Edit Profile Details'}</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {roleLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-name">
                {t('fullName')} *
              </label>
              <input
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                  fieldErrors.name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-brand-orange/20 focus:border-brand-orange'
                }`}
                id="edit-name"
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('enterFullName') || 'Enter full name'}
                required
                type="text"
                value={formName}
              />
              {fieldErrors.name && (
                <small className="text-xs text-rose-500 font-medium block">
                  {fieldErrors.name}
                </small>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-email">
                {t('emailAddress') || 'Email Address'}
              </label>
              <input
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                  fieldErrors.email
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-brand-orange/20 focus:border-brand-orange'
                }`}
                id="edit-email"
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder={t('enterEmailAddress') || 'Enter email address'}
                type="email"
                value={formEmail}
              />
              {fieldErrors.email && (
                <small className="text-xs text-rose-500 font-medium block">
                  {fieldErrors.email}
                </small>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-phone">
                {t('phoneNumber')} *
              </label>
              <input
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                  fieldErrors.phone
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-brand-orange/20 focus:border-brand-orange'
                }`}
                id="edit-phone"
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder={t('enterPhoneNumber') || 'Enter phone number'}
                required
                type="tel"
                value={formPhone}
              />
              {fieldErrors.phone && (
                <small className="text-xs text-rose-500 font-medium block">
                  {fieldErrors.phone}
                </small>
              )}
            </div>

            {/* Categories (Multi-select dropdown) for Supplier / Gruh Udyog */}
            {isSupplierLike && (
              <div className="space-y-1.5 relative" ref={categoryDropdownRef}>
                <label className="text-xs font-bold text-slate-700 block">
                  {t('categoriesSelectMultiple') || 'Categories (Select multiple) *'}
                </label>
                <div
                  className={`w-full min-h-[2.65rem] px-3.5 py-2 bg-white border rounded-xl text-sm text-slate-800 cursor-pointer flex items-center justify-between gap-2 shadow-xs transition-all ${
                    fieldErrors.category
                      ? 'border-rose-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                >
                  <span className="truncate text-xs sm:text-sm font-medium text-slate-700">
                    {formCategories.length > 0
                      ? `${formCategories.length} categories selected: ${formCategories.join(', ')}`
                      : 'Select categories...'}
                  </span>
                  <FiChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isCategoryDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Dropdown menu */}
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      {t('chooseMultipleCategories') || 'Choose Multiple Categories'}
                    </div>
                    {AVAILABLE_CATEGORIES.map((cat) => {
                      const isSelected = formCategories.includes(cat)
                      return (
                        <div
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-orange-50 text-brand-orange font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              checked={isSelected}
                              className="accent-brand-orange w-4 h-4 rounded cursor-pointer"
                              onChange={() => {}}
                              type="checkbox"
                            />
                            <span>{cat}</span>
                          </span>
                          {isSelected && <FiCheck className="w-4 h-4 text-brand-orange" />}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Selected category chips */}
                {formCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formCategories.map((cat) => (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-brand-orange border border-orange-200/70"
                        key={cat}
                      >
                        {cat}
                        <button
                          aria-label={`Remove category ${cat}`}
                          className="hover:text-rose-600 transition-colors cursor-pointer"
                          onClick={() => toggleCategory(cat)}
                          type="button"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {fieldErrors.category && (
                  <small className="text-xs text-rose-500 font-medium block">
                    {fieldErrors.category}
                  </small>
                )}
              </div>
            )}
          </div>

          {/* Service Areas */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isSupplierLike ? (t('coveredServiceAreas') || 'Covered Service Areas') : (t('shopArea') || 'Shop Area')} *
              </label>
              <p className="text-xs text-slate-400">
                {isSupplierLike
                  ? 'Suppliers match with shop owners located in these service areas. You can select multiple areas.'
                  : 'Your shop area location for local supplier discovery.'}
              </p>
            </div>

            {/* Input to add area */}
            <div className="flex gap-2">
              <input
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-xs transition-all"
                onChange={(e) => setFormAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addServiceArea()
                  }
                }}
                placeholder={t('typeAreaPrompt') || 'Type area (e.g. Maninagar, Satellite) and press Add'}
                type="text"
                value={formAreaInput}
              />
              <button
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                onClick={() => addServiceArea()}
                type="button"
              >
                <FiPlus className="w-4 h-4" />
                <span>{t('addArea') || 'Add Area'}</span>
              </button>
            </div>

            {/* Popular Area Suggestion Chips */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">{t('popularAreasPrompt') || 'Quick Suggestions:'}</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_AREAS.map((popArea) => {
                  const isAdded = formServiceAreas.some(
                    (a) => a.toLowerCase() === popArea.toLowerCase()
                  )
                  return (
                    <button
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isAdded
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      key={popArea}
                      onClick={() => (isAdded ? removeServiceArea(popArea) : addServiceArea(popArea))}
                      type="button"
                    >
                      {popArea} {isAdded ? '✓' : '+'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Areas Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {formServiceAreas.map((area) => (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs"
                  key={area}
                >
                  <FiMapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>{area}</span>
                  <button
                    aria-label={`Remove ${area}`}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                    onClick={() => removeServiceArea(area)}
                    type="button"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {fieldErrors.area && (
              <small className="text-xs text-rose-500 font-medium block">{fieldErrors.area}</small>
            )}
          </div>

          {/* Shop Owner Specific Fields */}
          {isShopOwner && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-shop-name">
                  {t('shopName')}
                </label>
                <input
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-xs transition-all"
                  id="edit-shop-name"
                  onChange={(e) => setFormShopName(e.target.value)}
                  placeholder={t('enterShopName')}
                  type="text"
                  value={formShopName}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="edit-shop-address">
                  {t('shopAddress')}
                </label>
                <input
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-xs transition-all"
                  id="edit-shop-address"
                  onChange={(e) => setFormShopAddress(e.target.value)}
                  placeholder={t('enterShopAddress')}
                  type="text"
                  value={formShopAddress}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
              disabled={isSaving}
              onClick={handleCancelEdit}
              type="button"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-orange text-white hover:bg-orange-700 active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
              disabled={isSaving}
              type="submit"
            >
              {isSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSaving ? (t('savingChanges') || 'Saving Changes...') : (t('saveChanges') || 'Save Changes')}</span>
            </button>
          </div>
        </form>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          <section
            aria-labelledby="profile-details-heading"
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
          >
            {/* User Identity Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-brand-orange font-bold text-xl flex items-center justify-center shadow-xs border border-orange-200/60 shrink-0">
                  {(user?.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-brand-orange uppercase tracking-wider block">
                    {t('accountDetails')}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900" id="profile-details-heading">
                    {user?.name || t('profile')}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-brand-orange bg-orange-50 border border-orange-200">
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Full Name */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <dt className="text-xs font-medium text-slate-400 mb-1">{t('fullName')}</dt>
                <dd className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-slate-400" />
                  <span>{user?.name || '-'}</span>
                </dd>
              </div>

              {/* Email */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <dt className="text-xs font-medium text-slate-400 mb-1">{t('email') || 'Email'}</dt>
                <dd className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiMail className="w-4 h-4 text-brand-orange" />
                  <span>{contactEmail}</span>
                </dd>
              </div>

              {/* Phone Number */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <dt className="text-xs font-medium text-slate-400 mb-1">{t('phoneNumber')}</dt>
                <dd className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-brand-orange" />
                  <span>{contactPhone}</span>
                </dd>
              </div>

              {/* Role & Joined */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <dt className="text-xs font-medium text-slate-400 mb-1">{t('memberSince')}</dt>
                <dd className="font-semibold text-slate-800">{joinedDate}</dd>
              </div>

              {/* Categories for Supplier / Gruh Udyog */}
              {isSupplierLike && (
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <FiTag className="w-3.5 h-3.5 text-brand-orange" />
                    <span>{t('categories')}</span>
                  </dt>
                  <dd>
                    {displayCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {displayCategories.map((cat) => (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-brand-orange border border-orange-200/60"
                            key={cat}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">{t('noCategoriesAssigned') || 'No categories assigned'}</span>
                    )}
                  </dd>
                </div>
              )}

              {/* Area / Service Areas */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 sm:col-span-2">
                <dt className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <FiMapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isSupplierLike ? t('serviceAreas') : t('area')}</span>
                </dt>
                <dd>
                  {displayAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {displayAreas.map((area) => (
                        <span
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80"
                          key={area}
                        >
                          <FiMapPin className="w-3 h-3 text-purple-600" />
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">{t('noAreaConfigured') || 'No area configured'}</span>
                  )}
                </dd>
              </div>

              {/* Shop Owner Information */}
              {isShopOwner && (
                <>
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <dt className="text-xs font-medium text-slate-400 mb-1">{t('shopName')}</dt>
                    <dd className="font-semibold text-slate-800 flex items-center gap-2">
                      <FiShoppingBag className="w-4 h-4 text-brand-orange" />
                      <span>{user?.shop?.name || '-'}</span>
                    </dd>
                  </div>
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <dt className="text-xs font-medium text-slate-400 mb-1">{t('shopAddress')}</dt>
                    <dd className="font-semibold text-slate-800">{user?.shop?.address || '-'}</dd>
                  </div>
                </>
              )}
            </dl>

            {/* Sign out */}
            <div className="pt-6 border-t border-slate-100">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 transition-colors cursor-pointer"
                onClick={handleSignOut}
                type="button"
              >
                <FiLogOut className="w-4 h-4" />
                <span>{t('signOut')}</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
