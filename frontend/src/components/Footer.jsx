import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheck, FiX, FiHelpCircle, FiShield, FiFileText, FiInfo, FiMail, FiMapPin } from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'

export default function Footer() {
  const { t } = useLocale()
  const location = useLocation()
  const navigate = useNavigate()
  const isRoleSelection = location.pathname === '/role-selection'

  const [activeModalTab, setActiveModalTab] = useState(null) // null | 'help' | 'faqs' | 'privacy' | 'terms' | 'cookies'

  const tabsRef = useRef(null)
  const contentRef = useRef(null)
  const [tabScroll, setTabScroll] = useState({ canScrollLeft: false, canScrollRight: false })
  const [contentScroll, setContentScroll] = useState({ canScrollTop: false, canScrollBottom: false })

  const updateTabScroll = () => {
    const el = tabsRef.current
    if (!el) return
    const canScrollLeft = el.scrollLeft > 2
    const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 3
    setTabScroll({ canScrollLeft, canScrollRight })
  }

  const updateContentScroll = () => {
    const el = contentRef.current
    if (!el) return
    const canScrollTop = el.scrollTop > 4
    const canScrollBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 6
    setContentScroll({ canScrollTop, canScrollBottom })
  }

  useEffect(() => {
    if (activeModalTab) {
      updateTabScroll()
      updateContentScroll()
      const t1 = setTimeout(() => {
        updateTabScroll()
        updateContentScroll()
      }, 50)
      const t2 = setTimeout(() => {
        updateTabScroll()
        updateContentScroll()
      }, 250)
      window.addEventListener('resize', updateTabScroll)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        window.removeEventListener('resize', updateTabScroll)
      }
    }
  }, [activeModalTab])

  const handleTabSelect = (tabId, e) => {
    setActiveModalTab(tabId)
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      setTimeout(updateTabScroll, 300)
    }
  }

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
    const isLandingPage =
      location.pathname === '/' ||
      ['/about', '/how-it-works', '/contact'].includes(location.pathname)

    if (sectionId === 'home') {
      if (isLandingPage) {
        window.history.pushState(null, '', '/')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate('/')
      }
      return
    }

    if (isLandingPage) {
      window.history.pushState(null, '', `#${sectionId}`)
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate(`/#${sectionId}`)
    }
  }

  return (
    <>
      <footer className="bg-white border-t border-slate-200/80 text-slate-600 mt-auto font-sans snap-start scroll-mt-16" aria-label="Footer">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isRoleSelection ? 'py-6' : 'pt-14 sm:pt-16 pb-12'}`}>
          {!isRoleSelection && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Column: Brand Identity */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  C
                </span>
                <span className="text-lg font-bold text-slate-900 leading-tight">
                  Connekto
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {t('strongerLocalBusinesses') || 'Connecting local shop owners and suppliers across India for smarter, simpler commerce.'}
              </p>
            </div>

            {/* Platform & Support Links side by side */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-6 sm:gap-12">
              {/* Column: Platform Links */}
              <div className="space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('footerPlatform')}</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li>
                    <a
                      href="#home"
                      onClick={(e) => handleSectionNav(e, 'home')}
                      className="text-slate-600 hover:text-brand-orange transition-colors"
                    >
                      {t('home')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#about"
                      onClick={(e) => handleSectionNav(e, 'about')}
                      className="text-slate-600 hover:text-brand-orange transition-colors"
                    >
                      {t('about')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      onClick={(e) => handleSectionNav(e, 'how-it-works')}
                      className="text-slate-600 hover:text-brand-orange transition-colors"
                    >
                      {t('howItWorks')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#contact"
                      onClick={(e) => handleSectionNav(e, 'contact')}
                      className="text-slate-600 hover:text-brand-orange transition-colors"
                    >
                      {t('contact')}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column: Support Links */}
              <div className="space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('footerSupport')}</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li>
                    <button
                      type="button"
                      onClick={() => openModal('help')}
                      className="text-left text-slate-600 hover:text-brand-orange transition-colors cursor-pointer"
                    >
                      {t('helpCenter')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => openModal('faqs')}
                      className="text-left text-slate-600 hover:text-brand-orange transition-colors cursor-pointer"
                    >
                      {t('faqs')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => openModal('privacy')}
                      className="text-left text-slate-600 hover:text-brand-orange transition-colors cursor-pointer"
                    >
                      {t('privacyPolicy')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => openModal('terms')}
                      className="text-left text-slate-600 hover:text-brand-orange transition-colors cursor-pointer"
                    >
                      {t('termsOfService')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => openModal('cookies')}
                      className="text-left text-slate-600 hover:text-brand-orange transition-colors cursor-pointer"
                    >
                      {t('cookiePolicy')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>

          </div>
          )}

          {/* Sub-Footer Copyright Bar */}
          <div className={`${!isRoleSelection ? 'mt-12 pt-6 border-t border-slate-100' : ''} flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500`}>
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
            {/* Modal Header & Navigation Tabs with Scroll Shadows */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 relative">
              {/* Scrollable Tabs Wrapper */}
              <div className="relative flex-1 min-w-0">
                {/* Left Scroll Shadow */}
                <div
                  className={`pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-slate-900/10 to-transparent transition-opacity duration-200 ${
                    tabScroll.canScrollLeft ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden="true"
                />

                {/* Horizontal Scrollable Tabs */}
                <div
                  ref={tabsRef}
                  onScroll={updateTabScroll}
                  className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none scroll-smooth touch-pan-x"
                >
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
                        onClick={(e) => handleTabSelect(tab.id, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${isActive
                            ? 'bg-orange-50 text-brand-orange border border-orange-200/80 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Right Scroll Shadow */}
                <div
                  className={`pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-slate-900/10 to-transparent transition-opacity duration-200 ${
                    tabScroll.canScrollRight ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 bg-white border border-slate-200/60 shadow-2xs transition-colors shrink-0 cursor-pointer"
                aria-label="Close modal"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Body with Top and Bottom Scroll Shadows */}
            <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Top Shadow when scrolled down */}
              <div
                className={`pointer-events-none absolute top-0 left-0 right-0 h-4 z-10 bg-gradient-to-b from-slate-900/10 to-transparent transition-opacity duration-200 ${contentScroll.canScrollTop ? 'opacity-100' : 'opacity-0'
                  }`}
                aria-hidden="true"
              />

              {/* Scrollable Content Container */}
              <div
                ref={contentRef}
                onScroll={updateContentScroll}
                className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh]"
              >

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

              {/* Bottom Shadow when content overflows below */}
              <div
                className={`pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10 bg-gradient-to-t from-slate-900/10 to-transparent transition-opacity duration-200 ${contentScroll.canScrollBottom ? 'opacity-100' : 'opacity-0'
                  }`}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
