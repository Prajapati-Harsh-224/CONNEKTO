import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiCheck, FiX, FiHelpCircle, FiShield, FiFileText, FiInfo, FiMail, FiMapPin, FiArrowRight } from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'

export default function Footer() {
  const { t } = useLocale()
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'success'
  const [error, setError] = useState('')
  const [activeModalTab, setActiveModalTab] = useState(null) // null | 'help' | 'faqs' | 'privacy' | 'terms' | 'cookies'

  // Sync modal state with URL hash if user enters via hash or uses back button
  useEffect(() => {
    const hash = window.location.hash
    if (hash === '#privacy-policy' || hash === '#privacy') setActiveModalTab('privacy')
    else if (hash === '#terms-of-service' || hash === '#terms') setActiveModalTab('terms')
    else if (hash === '#cookie-policy' || hash === '#cookies') setActiveModalTab('cookies')
    else if (hash === '#faqs') setActiveModalTab('faqs')
    else if (hash === '#help-center') setActiveModalTab('help')
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeModalTab) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [activeModalTab])

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModalTab) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModalTab])

  const openModal = (tab) => {
    setActiveModalTab(tab)
  }

  const closeModal = () => {
    setActiveModalTab(null)
    if (window.location.hash.includes('policy') || window.location.hash.includes('terms') || window.location.hash.includes('faqs') || window.location.hash.includes('help')) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }

  const handleSectionNav = (e, sectionId) => {
    e.preventDefault()
    const targetPath = sectionId === 'home' ? '/' : `/${sectionId}`
    navigate(targetPath)
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const el = document.getElementById(sectionId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSubscribe = (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setError('')
    setStatus('submitting')

    // Functional interaction with persistence
    setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('connekto_subscribers') || '[]')
        if (!stored.includes(trimmedEmail)) {
          stored.push(trimmedEmail)
          localStorage.setItem('connekto_subscribers', JSON.stringify(stored))
        }
      } catch {
        // Fallback gracefully
      }
      setStatus('success')
      setEmail('')
    }, 400)
  }

  return (
    <>
      <footer className="bg-white border-t border-slate-200/80 text-slate-600 mt-auto font-sans" aria-label="Footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12">
            
            {/* Column 1: Brand Info */}
            <div className="lg:col-span-4 space-y-3.5">
              <Link
                to="/"
                onClick={(e) => handleSectionNav(e, 'home')}
                className="inline-flex items-center gap-2.5 group"
                aria-label="Connekto Home"
              >
                <span className="w-8 h-8 rounded-full bg-[#f06535] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  C
                </span>
                <span className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900 leading-tight">Connekto</span>
                  <span className="text-xs text-slate-500 font-medium leading-none mt-0.5">{t('strongerLocalBusinesses')}</span>
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                {t('footerDescription')}
              </p>
            </div>

            {/* Column 2: Platform Links */}
            <div className="lg:col-span-2 space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('footerPlatform')}</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <a
                    href="#home"
                    onClick={(e) => handleSectionNav(e, 'home')}
                    className="text-slate-600 hover:text-[#f06535] transition-colors"
                  >
                    {t('home')}
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    onClick={(e) => handleSectionNav(e, 'about')}
                    className="text-slate-600 hover:text-[#f06535] transition-colors"
                  >
                    {t('about')}
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => handleSectionNav(e, 'how-it-works')}
                    className="text-slate-600 hover:text-[#f06535] transition-colors"
                  >
                    {t('howItWorks')}
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => handleSectionNav(e, 'contact')}
                    className="text-slate-600 hover:text-[#f06535] transition-colors"
                  >
                    {t('contact')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Support Links */}
            <div className="lg:col-span-2 space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('footerSupport')}</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('help')}
                    className="text-left text-slate-600 hover:text-[#f06535] transition-colors cursor-pointer"
                  >
                    {t('helpCenter')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('faqs')}
                    className="text-left text-slate-600 hover:text-[#f06535] transition-colors cursor-pointer"
                  >
                    {t('faqs')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('privacy')}
                    className="text-left text-slate-600 hover:text-[#f06535] transition-colors cursor-pointer"
                  >
                    {t('privacyPolicy')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('terms')}
                    className="text-left text-slate-600 hover:text-[#f06535] transition-colors cursor-pointer"
                  >
                    {t('termsOfService')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('cookies')}
                    className="text-left text-slate-600 hover:text-[#f06535] transition-colors cursor-pointer"
                  >
                    {t('cookiePolicy')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter / Subscribe Card */}
            <div className="lg:col-span-4">
              <div className="bg-[#f4f9f6] border border-emerald-100/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#14532d]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66 1.45-3.62C8.75 19.38 10.74 20 13 20c6.08 0 8-7 8-12 0-.55-.45-1-1-1zm-4 10c-1.8 0-3.39-.48-4.73-1.3l5.04-5.04c.39-.39.39-1.02 0-1.41a.996.996 0 00-1.41 0l-5.04 5.04C6.48 13.96 6 12.37 6 10.57c2.53-.48 5.75-1.54 8.52-2.19-1.39 3.03-1.89 6.64-1.52 9.62z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {t('stayUpdated')}
                    </strong>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t('stayUpdatedDesc')}
                    </p>
                  </div>
                </div>

                {status === 'success' ? (
                  <div className="mt-4 p-3 bg-white/90 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2 shadow-2xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Thanks for subscribing! You are on the list.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="mt-4 space-y-1.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (error) setError('')
                        }}
                        placeholder={t('enterYourEmail')}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-2xs transition-all"
                      />
                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="bg-[#0f5132] hover:bg-[#0b3d26] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        <span>{status === 'submitting' ? '...' : t('subscribe')}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                    {error && (
                      <p className="text-[11px] text-rose-600 font-medium">{error}</p>
                    )}
                  </form>
                )}

                <p className="text-xs text-emerald-800/80 font-normal mt-2.5">
                  {t('noSpam')}
                </p>
              </div>
            </div>

          </div>

          {/* Sub-Footer Copyright Bar */}
          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Connekto. {t('allRightsReserved')}</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span>🧡 {t('builtForStrongerLocalBusinesses')}</span>
              <span className="text-slate-300">|</span>
              <span>{t('madeInIndia')} 🇮🇳</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Support & Legal Modal Dialog */}
      {activeModalTab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Navigation Tabs */}
            <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {[
                  { id: 'help', label: t('helpCenter'), icon: FiHelpCircle },
                  { id: 'faqs', label: t('faqs'), icon: FiInfo },
                  { id: 'privacy', label: t('privacyPolicy'), icon: FiShield },
                  { id: 'terms', label: t('termsOfService'), icon: FiFileText },
                  { id: 'cookies', label: t('cookiePolicy'), icon: FiFileText },
                ].map((tab) => {
                  const isActive = activeModalTab === tab.id
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveModalTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-orange-50 text-brand-orange border border-orange-200/70 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              
              {/* Tab: Help Center */}
              {activeModalTab === 'help' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">{t('helpCenter')}</h4>
                    <p className="text-slate-500 text-xs">We are here to support local retailers, distributors, and producers.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-orange flex items-center justify-center">
                        <FiMail className="w-4 h-4" />
                      </div>
                      <strong className="block text-slate-900 font-semibold text-xs">Email Assistance</strong>
                      <a href="mailto:hello@connekto.in" className="text-brand-orange font-semibold hover:underline block">
                        hello@connekto.in
                      </a>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                        <FiMapPin className="w-4 h-4" />
                      </div>
                      <strong className="block text-slate-900 font-semibold text-xs">Regional Office</strong>
                      <p className="text-slate-600 font-medium">Ahmedabad, Gujarat, India</p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        closeModal()
                        handleSectionNav(e, 'contact')
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-orange hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Jump to Contact Form</span>
                      <FiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: FAQs */}
              {activeModalTab === 'faqs' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">Frequently Asked Questions</h4>
                    <p className="text-slate-500 text-xs">Common questions regarding Connekto and our prototype platform.</p>
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">What is Connekto?</strong>
                      <p className="text-slate-600 text-xs">Connekto is a digital commerce platform designed to link retail shop owners, wholesale suppliers, and home-based Gruh Udyog producers together in one unified ecosystem.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">Who can sign up for Connekto?</strong>
                      <p className="text-slate-600 text-xs">Any local retailer looking to streamline inventory orders, or wholesale suppliers and Gruh Udyog producers looking to distribute products within India.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">Is Connekto free during the prototype phase?</strong>
                      <p className="text-slate-600 text-xs">Yes. As a prototype, all platform features including catalog browsing, cart ordering, and supplier dashboards are currently free for early evaluation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Privacy Policy */}
              {activeModalTab === 'privacy' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">{t('privacyPolicy')}</h4>
                    <p className="text-slate-500 text-xs">Last updated: January 2026</p>
                  </div>
                  <p>At Connekto, we value the trust and privacy of local retailers and suppliers. This Privacy Policy outlines how information is gathered, utilized, and protected when navigating our platform.</p>
                  <div className="space-y-1.5">
                    <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">1. Information We Collect</strong>
                    <p className="text-xs">We gather business names, contact emails, phone numbers, and operational area details during account onboarding and catalog management.</p>
                  </div>
                  <div className="space-y-1.5">
                    <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">2. Data Usage & Security</strong>
                    <p className="text-xs">Collected data is used strictly to fulfill order inquiries, facilitate direct supplier connections, and customize localization preferences. We do not sell user data to third parties.</p>
                  </div>
                </div>
              )}

              {/* Tab: Terms of Service */}
              {activeModalTab === 'terms' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">{t('termsOfService')}</h4>
                    <p className="text-slate-500 text-xs">Effective Date: January 2026</p>
                  </div>
                  <p>Welcome to Connekto. By accessing or using our platform, you agree to comply with and be bound by the following terms and conditions.</p>
                  <div className="space-y-1.5">
                    <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">1. Prototype Notice</strong>
                    <p className="text-xs">Connekto is currently operating in prototype mode. Features, catalogs, and mock transaction workflows are subject to continuous enhancements.</p>
                  </div>
                  <div className="space-y-1.5">
                    <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">2. Role Responsibilities</strong>
                    <p className="text-xs">Suppliers and Gruh Udyog businesses are responsible for maintaining accurate product information and fulfillment commitments. Shop Owners are responsible for order review and verification.</p>
                  </div>
                </div>
              )}

              {/* Tab: Cookie Policy */}
              {activeModalTab === 'cookies' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">{t('cookiePolicy')}</h4>
                    <p className="text-slate-500 text-xs">Updated for Connekto Prototype</p>
                  </div>
                  <p>Connekto utilizes standard cookies and local storage tokens to deliver a responsive, localized browsing experience across languages.</p>
                  <div className="space-y-1.5">
                    <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">1. Necessary Cookies</strong>
                    <p className="text-xs">Essential for session continuity, user role selection (Shop Owner, Supplier, Gruh Udyog), and language choice (English, Hindi, Gujarati).</p>
                  </div>
                  <div className="space-y-1.5">
                    <strong className="block text-slate-900 font-semibold text-xs sm:text-sm">2. Preferences & Analytics</strong>
                    <p className="text-xs">Remembers newsletter subscriptions and catalog search filters to optimize navigation speeds.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
