import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RoleCard from '../components/RoleCard.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { saveSelectedRole } from '../utils/roleStorage.js'
import shopOwnerImage from '../assets/shop_owner_img.png'
import supplierImage from '../assets/Supplier_img.png'
import gruhUdyogImage from '../assets/gruh_udhyog_img.png'

const roles = [
  { value: 'SHOP_OWNER', titleKey: 'shopOwner', descriptionKey: 'shopOwnerDescription', tone: 'orange', image: shopOwnerImage, overlayKey: 'shopOwnerOverlay', imageAltKey: 'shopOwnerImageAlt', benefitKeys: ['shopOwnerBenefitOne', 'shopOwnerBenefitTwo', 'shopOwnerBenefitThree'] },
  { value: 'SUPPLIER', titleKey: 'supplier', descriptionKey: 'supplierDescription', tone: 'green', image: supplierImage, overlayKey: 'supplierOverlay', imageAltKey: 'supplierImageAlt', benefitKeys: ['supplierBenefitOne', 'supplierBenefitTwo', 'supplierBenefitThree'] },
  { value: 'GRUH_UDYOG', titleKey: 'gruhUdyog', descriptionKey: 'gruhUdyogDescription', tone: 'purple', image: gruhUdyogImage, overlayKey: 'gruhUdyogOverlay', imageAltKey: 'gruhUdyogImageAlt', benefitKeys: ['gruhUdyogBenefitOne', 'gruhUdyogBenefitTwo', 'gruhUdyogBenefitThree'] },
]

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState('')
  const navigate = useNavigate()
  const { t } = useLocale()

  function continueToSignup() {
    if (!selectedRole) return
    saveSelectedRole(selectedRole)
    navigate(`/signup?role=${selectedRole}`)
  }

  return (
    <section className="setup-page role-selection-page">
      <div className="role-editorial">
        <div className="eyebrow">{t('accountSetup')}</div>
        <h1>{t('roleSelectionHeading')}</h1>
        <p className="role-intro">{t('roleSelectionIntro')}</p>
        <div className="role-benefits">
          {['benefitLocal', 'benefitGrowth', 'benefitNetwork'].map((key, index) => (
            <div className="role-benefit" key={key}>
              <span className={`role-benefit-icon role-benefit-icon--${index}`} aria-hidden="true">{['✦', '↗', '✓'][index]}</span>
              <span><strong>{t(`${key}Title`)}</strong><small>{t(`${key}Description`)}</small></span>
            </div>
          ))}
        </div>
        <blockquote className="role-quote"><span aria-hidden="true">“</span><p>{t('roleQuote')}</p><cite>— {t('appName')}</cite></blockquote>
      </div>

      <div className="role-picker">
        <div className="role-picker-heading">
          <div><div className="eyebrow">{t('selectYourRole')}</div><h2>{t('selectRole')}</h2></div>
          <div className="role-progress" aria-label={t('roleProgressLabel')}>
            {[['1', 'chooseRoleStep'], ['2', 'createAccountStep'], ['3', 'getStartedStep']].map(([number, labelKey], index) => (
              <div className={`role-progress-step${index === 0 ? ' active' : ''}`} key={number}>
                <span>{number}</span><small>{t(labelKey)}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="role-grid">
          {roles.map((role) => (
            <RoleCard key={role.value} role={{ ...role, title: t(role.titleKey), description: t(role.descriptionKey), overlay: t(role.overlayKey), imageAlt: t(role.imageAltKey), benefits: role.benefitKeys.map((key) => t(key)) }} selected={selectedRole === role.value} onSelect={setSelectedRole} />
          ))}
        </div>
        <div className="role-actions">
          <button className="button primary" disabled={!selectedRole} onClick={continueToSignup} type="button">{t('continue')} <span aria-hidden="true">→</span></button>
          <span className="muted selection-status" aria-live="polite">{selectedRole ? t('roleSelected') : t('selectOneRole')}</span>
        </div>
      </div>
    </section>
  )
}
