import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RoleCard from '../components/RoleCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSelectedRole, saveSelectedRole } from '../utils/roleStorage.js'
import shopOwnerImage from '../assets/shop_owner_img.webp'
import supplierImage from '../assets/Supplier_img.webp'

const roles = [
  { value: 'SHOP_OWNER', titleKey: 'shopOwner', descriptionKey: 'shopOwnerDescription', tone: 'orange', image: shopOwnerImage, overlayKey: 'shopOwnerOverlay', imageAltKey: 'shopOwnerImageAlt', benefitKeys: ['shopOwnerBenefitOne', 'shopOwnerBenefitTwo', 'shopOwnerBenefitThree'] },
  { value: 'SUPPLIER', titleKey: 'supplier', descriptionKey: 'supplierDescription', tone: 'green', image: supplierImage, overlayKey: 'supplierOverlay', imageAltKey: 'supplierImageAlt', benefitKeys: ['supplierBenefitOne', 'supplierBenefitTwo', 'supplierBenefitThree'] },
]

export default function RoleSelectionPage() {
  const [searchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role')
  const validRoleValues = roles.map((r) => r.value)
  const initialRole = validRoleValues.includes(roleFromUrl)
    ? roleFromUrl
    : (validRoleValues.includes(getSelectedRole()) ? getSelectedRole() : '')
  const [selectedRole, setSelectedRole] = useState(initialRole)
  const continueBtnRef = useRef(null)
  const navigate = useNavigate()
  const { t } = useLocale()

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue)
    if (window.innerWidth < 768) {
      setTimeout(() => {
        continueBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }

  function continueToSignup(roleToUse = selectedRole) {
    if (!roleToUse) return
    saveSelectedRole(roleToUse)
    navigate(`/signup?role=${roleToUse}`)
  }

  return (
    <section className="w-full min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)] lg:overflow-hidden max-w-7xl xl:max-w-[1360px] 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5 lg:py-6 flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] gap-6 lg:gap-10 xl:gap-12 items-stretch w-full">
        {/* Left Column: Context, Features, Quote */}
        <div className="flex flex-col justify-between h-full max-w-xl lg:max-w-none">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-orange bg-brand-orange-light border border-brand-orange/20 mb-2">
              <span>✦</span>
              <span>{t('accountSetup')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[2.1rem] xl:text-[2.4rem] font-bold font-serif text-brand-navy tracking-tight leading-[1.16] whitespace-pre-line mb-2">
              {t('roleSelectionHeading')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t('roleSelectionIntro')}
            </p>
          </div>

          {/* 3 Structured Feature Benefit Cards */}
          <div className="flex flex-col gap-2.5 sm:gap-3 my-3 lg:my-auto">
            {['benefitLocal', 'benefitGrowth', 'benefitNetwork'].map((key, index) => (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-brand-orange/30 hover:shadow-xs transition-all"
              >
                <span
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                    index === 0
                      ? 'bg-brand-orange-light text-brand-orange'
                      : index === 1
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                  aria-hidden="true"
                >
                  {['✦', '↗', '✓'][index]}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="text-xs sm:text-sm font-semibold text-slate-900 block leading-tight">
                    {t(`${key}Title`)}
                  </strong>
                  <small className="text-[11px] sm:text-xs text-slate-500 leading-normal block mt-0.5">
                    {t(`${key}Description`)}
                  </small>
                </div>
              </div>
            ))}
          </div>

          {/* Quote Block */}
          <blockquote className="border-l-3 border-brand-orange bg-gradient-to-r from-orange-50/70 to-transparent p-3 sm:p-3.5 rounded-r-xl text-xs italic text-slate-700">
            <p className="leading-relaxed">“{t('roleQuote')}”</p>
            <cite className="block not-italic text-[11px] text-slate-500 font-semibold mt-1">
              — {t('appName')}
            </cite>
          </blockquote>
        </div>

        {/* Right Column: Cards & Action CTA */}
        <div className="flex flex-col justify-between h-full w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 xl:gap-6 flex-1 items-stretch">
            {roles.map((role) => (
              <RoleCard
                key={role.value}
                role={{
                  ...role,
                  title: t(role.titleKey),
                  description: t(role.descriptionKey),
                  overlay: t(role.overlayKey),
                  imageAlt: t(role.imageAltKey),
                  benefits: role.benefitKeys.map((key) => t(key)),
                }}
                selected={selectedRole === role.value}
                onSelect={handleRoleSelect}
              />
            ))}
          </div>

          {/* Action CTA spanning full width */}
          <div className="mt-4 pt-1 shrink-0 w-full">
            <button
              ref={continueBtnRef}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole
                  ? 'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-md shadow-brand-orange/20 active:scale-[0.99]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!selectedRole}
              onClick={() => continueToSignup()}
              type="button"
            >
              <span>{t('continue')}</span>
              <span aria-hidden="true">→</span>
            </button>
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-400 font-medium mt-2">
              <span>🔒 Safe & Secure</span>
              <span>•</span>
              <span>⚡ Instant Setup</span>
              <span>•</span>
              <span>🔄 Switch Role Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
