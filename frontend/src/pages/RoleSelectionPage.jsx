import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RoleCard from '../components/RoleCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSelectedRole, saveSelectedRole } from '../utils/roleStorage.js'
import shopOwnerImage from '../assets/shop_owner_img.png'
import supplierImage from '../assets/Supplier_img.png'
import gruhUdyogImage from '../assets/gruh_udhyog_img.png'

const roles = [
  { value: 'SHOP_OWNER', titleKey: 'shopOwner', descriptionKey: 'shopOwnerDescription', tone: 'orange', image: shopOwnerImage, overlayKey: 'shopOwnerOverlay', imageAltKey: 'shopOwnerImageAlt', benefitKeys: ['shopOwnerBenefitOne', 'shopOwnerBenefitTwo', 'shopOwnerBenefitThree'] },
  { value: 'SUPPLIER', titleKey: 'supplier', descriptionKey: 'supplierDescription', tone: 'green', image: supplierImage, overlayKey: 'supplierOverlay', imageAltKey: 'supplierImageAlt', benefitKeys: ['supplierBenefitOne', 'supplierBenefitTwo', 'supplierBenefitThree'] },
  { value: 'GRUH_UDYOG', titleKey: 'gruhUdyog', descriptionKey: 'gruhUdyogDescription', tone: 'purple', image: gruhUdyogImage, overlayKey: 'gruhUdyogOverlay', imageAltKey: 'gruhUdyogImageAlt', benefitKeys: ['gruhUdyogBenefitOne', 'gruhUdyogBenefitTwo', 'gruhUdyogBenefitThree'] },
]

export default function RoleSelectionPage() {
  const [searchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role')
  const validRoleValues = roles.map((r) => r.value)
  const initialRole = validRoleValues.includes(roleFromUrl)
    ? roleFromUrl
    : (validRoleValues.includes(getSelectedRole()) ? getSelectedRole() : '')
  const [selectedRole, setSelectedRole] = useState(initialRole)
  const navigate = useNavigate()
  const { t } = useLocale()

  function continueToSignup(roleToUse = selectedRole) {
    if (!roleToUse) return
    saveSelectedRole(roleToUse)
    navigate(`/signup?role=${roleToUse}`)
  }

  return (
    <section className="min-h-[calc(100vh-4.5rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-[minmax(280px,0.72fr)_minmax(600px,1.28fr)] gap-8 lg:gap-14 items-center">
      <div className="flex flex-col justify-center max-w-xl lg:max-w-none">
        <div className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-2">{t('accountSetup')}</div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-brand-navy tracking-tight leading-[1.1] mb-4">
          {t('roleSelectionHeading')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 sm:mb-8">
          {t('roleSelectionIntro')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 mb-8">
          {['benefitLocal', 'benefitGrowth', 'benefitNetwork'].map((key, index) => (
            <div className="flex items-start gap-3" key={key}>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
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
              <div>
                <strong className="text-xs sm:text-sm font-semibold text-slate-800 block">
                  {t(`${key}Title`)}
                </strong>
                <small className="text-[11px] sm:text-xs text-slate-500 leading-normal block mt-0.5">
                  {t(`${key}Description`)}
                </small>
              </div>
            </div>
          ))}
        </div>

        <blockquote className="border-l-2 border-brand-orange/30 pl-4 text-xs sm:text-sm italic text-slate-600">
          <p>“{t('roleQuote')}”</p>
          <cite className="block not-italic text-[11px] text-slate-500 font-medium mt-1.5">
            — {t('appName')}
          </cite>
        </blockquote>
      </div>

      <div className="flex flex-col justify-center w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 w-full">
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
              onSelect={setSelectedRole}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 sm:mt-8">
          <button
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              selectedRole
                ? 'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-md shadow-brand-orange/20 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
            disabled={!selectedRole}
            onClick={() => continueToSignup()}
            type="button"
          >
            <span>{t('continue')}</span>
            <span aria-hidden="true">→</span>
          </button>
          <span className="text-xs text-slate-500 font-medium" aria-live="polite">
            {selectedRole ? t('roleSelected') : t('selectOneRole')}
          </span>
        </div>
      </div>
    </section>
  )
}
