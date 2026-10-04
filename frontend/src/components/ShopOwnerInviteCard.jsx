import { useState, useId } from 'react'
import {
  FiPhone,
  FiCopy,
  FiCheck,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiRotateCcw,
  FiShare2,
} from 'react-icons/fi'
import { FaWhatsapp, FaCommentSms } from 'react-icons/fa6'

export const POPULAR_COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
]

export default function ShopOwnerInviteCard({ user, t = (k) => k }) {
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isEditingMessage, setIsEditingMessage] = useState(false)

  const phoneInputId = useId()
  const countryCodeId = useId()

  const shopName = user?.shop?.name?.trim() || ''
  const ownerName = user?.name?.trim() || 'a retail shop owner'
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://connekto.com'

  const defaultInviteMessage = shopName
    ? `Hello! This is ${ownerName} from ${shopName}. We use Connekto to connect and order directly from local suppliers and FMCG distributors. Join Connekto to supply your products directly to our shop: ${appOrigin}`
    : `Hello! This is ${ownerName}. I use Connekto to connect and order directly from local suppliers and distributors. Join Connekto to list and supply your products: ${appOrigin}`

  const [customMessage, setCustomMessage] = useState('')
  const effectiveMessage = customMessage.trim() || defaultInviteMessage

  // Clean and sanitize phone number
  const getSanitizedNumber = () => {
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    const cleanCountry = countryCode.replace(/\D/g, '')

    // If user typed / pasted country code into phone field as well, strip leading match
    if (cleanPhone.startsWith(cleanCountry) && cleanPhone.length > cleanCountry.length + 6) {
      cleanPhone = cleanPhone.slice(cleanCountry.length)
    }

    // Strip domestic leading zeros (e.g., 09876543210 -> 9876543210)
    if (cleanPhone.startsWith('0') && cleanPhone.length > 7) {
      cleanPhone = cleanPhone.replace(/^0+/, '')
    }

    return { cleanCountry, cleanPhone }
  }

  // Validate phone input
  const validatePhone = () => {
    const { cleanPhone } = getSanitizedNumber()
    if (!cleanPhone) {
      const err = t('phoneRequiredError') || 'Please enter a mobile phone number.'
      setErrorMessage(err)
      return false
    }
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      const err = t('invalidPhoneError') || 'Please enter a valid phone number (at least 7 digits).'
      setErrorMessage(err)
      return false
    }
    setErrorMessage('')
    return true
  }

  // Handle WhatsApp Invite
  const handleSendWhatsApp = (e) => {
    e?.preventDefault()
    if (!validatePhone()) return

    const { cleanCountry, cleanPhone } = getSanitizedNumber()
    const fullNumber = `${cleanCountry}${cleanPhone}`
    const encodedText = encodeURIComponent(effectiveMessage)
    const waUrl = `https://wa.me/${fullNumber}?text=${encodedText}`

    setStatusMessage(t('inviteSentWhatsAppSuccess') || 'Opening WhatsApp with your invitation...')
    window.open(waUrl, '_blank', 'noopener,noreferrer')

    setTimeout(() => {
      setStatusMessage('')
    }, 4000)
  }

  // Handle SMS Invite
  const handleSendSMS = (e) => {
    e?.preventDefault()
    if (!validatePhone()) return

    const { cleanCountry, cleanPhone } = getSanitizedNumber()
    const fullInternational = `+${cleanCountry}${cleanPhone}`
    const encodedText = encodeURIComponent(effectiveMessage)

    // Detect iOS for SMS body query separator ('&' vs '?')
    const isIOS =
      typeof navigator !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.MSStream
    const separator = isIOS ? '&' : '?'
    const smsUrl = `sms:${fullInternational}${separator}body=${encodedText}`

    setStatusMessage(t('inviteSentSMSSuccess') || 'Opening SMS composer with your invitation...')
    window.location.href = smsUrl

    setTimeout(() => {
      setStatusMessage('')
    }, 4000)
  }

  // Handle Copy Message
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(effectiveMessage)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2500)
    } catch {
      // Fallback
      setIsCopied(false)
    }
  }

  // Reset custom message
  const handleResetMessage = () => {
    setCustomMessage('')
    setIsEditingMessage(false)
  }

  return (
    <section
      aria-labelledby="invite-suppliers-heading"
      className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-brand-orange shadow-xs shrink-0">
            <FiShare2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">
              {t('supplierNetwork') || 'Supplier Network'}
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold text-slate-900"
              id="invite-suppliers-heading"
            >
              {t('inviteSuppliersTitle') || 'Invite Suppliers & Distributors'}
            </h2>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 self-start sm:self-auto">
          <FaWhatsapp className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp &amp; SMS</span>
        </span>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        {t('inviteSuppliersSubtitle') ||
          'Invite your trusted local suppliers or distributors to Connekto via WhatsApp or SMS to streamline your purchasing and product orders.'}
      </p>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs transition-all animate-fadeIn"
          role="status"
        >
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer ml-3"
            onClick={() => setStatusMessage('')}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs transition-all animate-fadeIn"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer ml-3"
            onClick={() => setErrorMessage('')}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Group: Country Code + Phone Number */}
      <div className="space-y-2">
        <label
          className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
          htmlFor={phoneInputId}
        >
          <FiPhone className="w-3.5 h-3.5 text-brand-orange" />
          <span>{t('supplierPhoneNumber') || "Supplier's Phone Number"} *</span>
        </label>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Country Code Dropdown */}
          <div className="relative sm:w-56 shrink-0">
            <label className="sr-only" htmlFor={countryCodeId}>
              {t('countryCode') || 'Country Code'}
            </label>
            <select
              className="w-full h-11 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-xs transition-all cursor-pointer"
              id={countryCodeId}
              onChange={(e) => {
                setCountryCode(e.target.value)
                setErrorMessage('')
              }}
              value={countryCode}
            >
              {POPULAR_COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.code} ({item.country})
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number Input */}
          <div className="flex-1 relative">
            <input
              className={`w-full h-11 px-3.5 py-2 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                errorMessage
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-brand-orange/20 focus:border-brand-orange'
              }`}
              id={phoneInputId}
              inputMode="tel"
              onChange={(e) => {
                setPhoneNumber(e.target.value)
                if (errorMessage) setErrorMessage('')
              }}
              placeholder={t('phoneInputPlaceholder') || 'e.g. 9876543210'}
              type="tel"
              value={phoneNumber}
            />
            {phoneNumber && (
              <button
                aria-label="Clear phone input"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer p-1"
                onClick={() => setPhoneNumber('')}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          {t('phoneInputHelp') ||
            'Enter the 10-digit mobile number for suppliers in India or full local number for other countries.'}
        </p>
      </div>

      {/* Action Buttons: WhatsApp & SMS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* 1. WhatsApp Button */}
        <button
          className="h-11 sm:h-12 px-5 rounded-xl text-sm font-semibold bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer group"
          id="btn-invite-whatsapp"
          onClick={handleSendWhatsApp}
          type="button"
        >
          <FaWhatsapp className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          <span>{t('sendOnWhatsApp') || 'Invite on WhatsApp'}</span>
        </button>

        {/* 2. SMS Button */}
        <button
          className="h-11 sm:h-12 px-5 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer group"
          id="btn-invite-sms"
          onClick={handleSendSMS}
          type="button"
        >
          <FaCommentSms className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span>{t('sendViaSMS') || 'Invite via SMS'}</span>
        </button>
      </div>

      {/* Message Preview Accordion */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>{t('inviteMessagePreview') || 'Invitation Message Preview'}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              className="text-xs font-semibold text-slate-500 hover:text-brand-orange inline-flex items-center gap-1 transition-colors cursor-pointer"
              onClick={() => setIsEditingMessage((prev) => !prev)}
              type="button"
            >
              <FiEdit3 className="w-3.5 h-3.5" />
              <span>
                {isEditingMessage
                  ? t('doneEditing') || 'Done'
                  : t('customizeMessage') || 'Customize'}
              </span>
            </button>

            {customMessage && (
              <button
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                onClick={handleResetMessage}
                title="Reset to default message"
                type="button"
              >
                <FiRotateCcw className="w-3.5 h-3.5" />
                <span>{t('reset') || 'Reset'}</span>
              </button>
            )}

            <button
              className={`text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isCopied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={handleCopyMessage}
              type="button"
            >
              {isCopied ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('messageCopied') || 'Copied!'}</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('copyMessage') || 'Copy Text'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isEditingMessage ? (
          <textarea
            className="w-full p-3 bg-white border border-brand-orange/40 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 shadow-xs resize-y min-h-[90px]"
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your custom invitation message..."
            rows={3}
            value={customMessage || defaultInviteMessage}
          />
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed break-words font-mono selection:bg-orange-100">
            {effectiveMessage}
          </div>
        )}
      </div>
    </section>
  )
}
