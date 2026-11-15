import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FiArrowRight,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiShoppingBag,
  FiShoppingCart,
  FiTruck,
  FiMail,
  FiMapPin,
  FiCheck,
  FiX,
  FiLayers,
  FiTrendingUp,
  FiShield,
  FiSend,
  FiZap,
} from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'
import InteractivePhoneMockup from '../components/InteractivePhoneMockup.jsx'

export default function WelcomePage() {
  const { t } = useLocale()
  const location = useLocation()
  const [activeRoleMode, setActiveRoleMode] = useState('retailer') // 'retailer' | 'supplier'
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(90)
  const [isMuted, setIsMuted] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef(null)
  const videoContainerRef = useRef(null)

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (hasEnded) {
      videoRef.current.currentTime = 0
      setHasEnded(false)
    }
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (e) => {
    const time = Number(e.target.value)
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    if (isVideoModalOpen) {
      setHasEnded(false)
      setVideoError(false)
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0
          videoRef.current.play().then(() => {
            setIsPlaying(true)
          }).catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true
              setIsMuted(true)
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
            }
          })
        }
      }, 150)
      return () => clearTimeout(timer)
    } else {
      if (videoRef.current) {
        videoRef.current.pause()
      }
      setIsPlaying(false)
    }
  }, [isVideoModalOpen])

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', role: 'SHOP_OWNER', message: '' })
  const [contactStatus, setContactStatus] = useState('idle') // 'idle' | 'submitting' | 'success'
  const [contactError, setContactError] = useState('')

  const scrollTo = useCallback((id) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (el) {
      const headerOffset = 70
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    // Disable browser automatic scroll restoration so refresh always starts at top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)

    // When refreshing or loading on section routes, reset URL to '/' so home is shown
    if (['/about', '/how-it-works', '/contact'].includes(location.pathname) || location.hash) {
      window.history.replaceState(null, '', '/')
      window.scrollTo(0, 0)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('snap-scroll-page')
    document.body.classList.add('snap-scroll-page')
    return () => {
      document.documentElement.classList.remove('snap-scroll-page')
      document.body.classList.remove('snap-scroll-page')
    }
  }, [])

  // Lock scroll when video modal is open
  useEffect(() => {
    if (isVideoModalOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setIsVideoModalOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isVideoModalOpen])

  const handleContactSubmit = (e) => {
    e.preventDefault()
    if (!contactForm.name.trim()) {
      setContactError('Please enter your name.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactForm.email.trim())) {
      setContactError('Please enter a valid email address.')
      return
    }
    if (!contactForm.message.trim()) {
      setContactError('Please enter your message or question.')
      return
    }

    setContactError('')
    setContactStatus('submitting')

    // Simulate sending message
    setTimeout(() => {
      setContactStatus('success')
      setContactForm({ name: '', email: '', role: 'SHOP_OWNER', message: '' })
    }, 450)
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">

      {/* ── HERO SECTION (High-Contrast Dark Glassmorphism) ── */}
      <section
        className="relative w-full overflow-hidden min-h-[580px] lg:min-h-[660px] pt-6 sm:pt-12 pb-12 sm:pb-24 flex items-center snap-start scroll-mt-16 bg-[#090d16]"
        id="home"
        aria-label="Hero"
      >
        {/* Subtle radial ambient glows in eco-friendly blue-green accents */}
        <div
          className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[580px] h-96 sm:h-[580px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 right-1/4 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-gradient-to-bl from-teal-500/12 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-6 left-1/3 w-72 sm:w-[420px] h-72 sm:h-[420px] bg-gradient-to-t from-cyan-500/8 to-transparent rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60"
          aria-hidden="true"
        />

        {/* Hero Content Layer */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Sharp B2B Copy & CTAs */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
              {/* Top Pill Badge */}
              <div>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-xs">
                  <span className="text-emerald-400">✦</span>
                  <span>{t('heroEyebrow')}</span>
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                {t('heroHeading')}
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl">
                {t('heroSubtitle')}
              </p>

              {/* Interactive Role Switcher Pill */}
              <div className="space-y-3 pt-1">
                <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => setActiveRoleMode('retailer')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeRoleMode === 'retailer'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('forRetailers')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoleMode('supplier')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeRoleMode === 'supplier'
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('forSuppliers')}
                  </button>
                </div>

                {/* Role Dynamic Highlights */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {activeRoleMode === 'retailer' ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-emerald-300 font-medium">
                        <FiCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Compare live rates across distributors
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-emerald-300 font-medium">
                        <FiCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1-Tap consolidated cart & split delivery
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-teal-300 font-medium">
                        <FiCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Expand distribution to 500+ local retail shops
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-teal-300 font-medium">
                        <FiCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Real-time catalog & digital order settlement
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 shadow-lg shadow-emerald-500/25 transition-all flex-1 sm:flex-initial"
                  to={activeRoleMode === 'retailer' ? '/signup?role=SHOP_OWNER' : '/signup?role=SUPPLIER'}
                >
                  <span>{activeRoleMode === 'retailer' ? t('primaryCtaShop') : t('secondaryCtaSupplier')}</span>
                  <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>

                <Link
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 active:scale-95 transition-all flex-1 sm:flex-initial"
                  to={activeRoleMode === 'retailer' ? '/signup?role=SUPPLIER' : '/signup?role=SHOP_OWNER'}
                >
                  <span>{activeRoleMode === 'retailer' ? t('secondaryCtaSupplier') : t('primaryCtaShop')}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer group"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiPlay className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </span>
                  <span>{t('watchTour')}</span>
                </button>
              </div>

              {/* Trust Micro-Metrics Row below CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <FiZap className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{t('trustMetricComparison')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0">
                    <FiShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{t('trustMetricConsolidated')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0">
                    <FiShield className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{t('trustMetricLanguages')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end py-4 lg:py-0">
              <InteractivePhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section
        className="relative w-full h-auto min-h-0 max-h-none sm:min-h-[580px] flex flex-col sm:items-center justify-center snap-start scroll-mt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 sm:py-20 overflow-hidden"
        id="about"
        aria-labelledby="about-heading"
      >
        <div className="w-full flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-14 items-center">
            <div className="lg:col-span-7 space-y-2.5 sm:space-y-4">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-orange">{t('aboutEyebrow')}</span>
              <h2 id="about-heading" className="text-xl sm:text-4xl font-extrabold text-brand-navy leading-snug">{t('aboutHeading')}</h2>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-base text-slate-600 leading-relaxed">
                <p>{t('aboutBody1')}</p>
                <p>{t('aboutBody2')}</p>
                <p>{t('aboutBody3')}</p>
              </div>
              <p className="text-xs sm:text-base font-semibold text-brand-navy pt-1 sm:pt-2">{t('aboutClosing')}</p>

              {/* Compact Role Indicator for mobile */}
              <div className="grid grid-cols-2 gap-2 pt-1 sm:hidden">
                <Link
                  to="/signup?role=SHOP_OWNER"
                  className="flex items-center gap-2 p-2 rounded-xl bg-orange-50/80 border border-orange-100 shadow-2xs hover:bg-orange-100/70 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-white text-brand-orange flex items-center justify-center shrink-0 shadow-xs">
                    <FiShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-[11px] font-bold text-slate-900 truncate">{t('shopOwner')}</strong>
                    <span className="block text-[9px] text-slate-500 truncate">{t('aboutShopOwnerShort1')}</span>
                  </div>
                </Link>
                <Link
                  to="/signup?role=SUPPLIER"
                  className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/80 border border-emerald-100 shadow-2xs hover:bg-emerald-100/70 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                    <FiTruck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-[11px] font-bold text-slate-900 truncate">{t('supplier')}</strong>
                    <span className="block text-[9px] text-slate-500 truncate">{t('aboutSupplierShort1')}</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Role Diagram / Visual for desktop (sm+) */}
            <div className="hidden sm:flex lg:col-span-5 justify-center" aria-hidden="true">
              <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white text-xl font-black mx-auto flex items-center justify-center shadow-md">
                  C
                </div>
                <h3 className="text-xl font-black text-brand-navy">Connekto</h3>
                <p className="text-xs text-slate-500">Unified local commerce ecosystem connecting retailers and suppliers.</p>

                <div className="grid grid-cols-1 gap-3 pt-4 text-left">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/70 border border-orange-100">
                    <div className="w-8 h-8 rounded-lg bg-white text-brand-orange flex items-center justify-center shadow-xs">
                      <FiShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-slate-900">{t('shopOwner')}</strong>
                      <span className="block text-[11px] text-slate-500 truncate">{t('aboutShopOwnerShort1')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <div className="w-8 h-8 rounded-lg bg-white text-emerald-600 flex items-center justify-center shadow-xs">
                      <FiTruck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-slate-900">{t('supplier')}</strong>
                      <span className="block text-[11px] text-slate-500 truncate">{t('aboutSupplierShort1')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (SECTION 3.D) ── */}
      <section
        className="relative w-full h-auto min-h-0 bg-slate-50/70 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-8 sm:py-20 flex flex-col sm:items-center justify-center snap-start scroll-mt-16 overflow-hidden"
        id="how-it-works"
        aria-labelledby="hiw-heading"
      >
        <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-1 sm:space-y-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-orange">{t('hiwEyebrow')}</span>
            <h2 id="hiw-heading" className="text-xl sm:text-4xl font-extrabold text-brand-navy leading-snug">{t('hiwHeading')}</h2>
            <p className="text-xs sm:text-base text-slate-500">{t('hiwSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { num: '01', titleKey: 'hiwStep1Title', descKey: 'hiwStep1Desc' },
              { num: '02', titleKey: 'hiwStep2Title', descKey: 'hiwStep2Desc' },
              { num: '03', titleKey: 'hiwStep3Title', descKey: 'hiwStep3Desc' },
              { num: '04', titleKey: 'hiwStep4Title', descKey: 'hiwStep4Desc' },
            ].map((step) => (
              <div
                key={step.num}
                className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/80 space-y-2 sm:space-y-3 relative hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-xl sm:text-3xl font-black text-brand-orange/40 mb-2">{step.num}</div>
                  <strong className="block text-sm sm:text-base font-bold text-slate-900 leading-snug mb-1">{t(step.titleKey)}</strong>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION (SECTION 3.E) ── */}
      <section
        className="relative w-full h-auto min-h-0 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 sm:py-20 flex flex-col justify-center snap-start scroll-mt-16 overflow-hidden"
        id="contact"
        aria-labelledby="contact-heading"
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Direct Info & Illustration */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-orange">{t('contactEyebrow')}</span>
            <h2 id="contact-heading" className="text-xl sm:text-4xl font-extrabold text-brand-navy leading-snug">{t('contactHeading')}</h2>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed">{t('contactSubtitle')}</p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-200/60 shadow-xs">
                  <FiMail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 font-semibold">{t('contactEmailLabel')}</span>
                  <a className="font-semibold text-brand-orange hover:underline truncate" href="mailto:hello@connekto.in">
                    hello@connekto.in
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-200/60 shadow-xs">
                  <FiMapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 font-semibold">{t('contactLocationLabel')}</span>
                  <span className="font-semibold text-slate-800">{t('contactLocation')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Working Contact Form */}
          <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs">
            {contactStatus === 'success' ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-slate-900">{t('contactMessageSent')}</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Our regional team will review your inquiry and follow up within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => setContactStatus('idle')}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-brand-orange bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-left">
                    <span className="text-xs font-semibold text-slate-700">
                      {t('contactNameLabel')} <span className="text-brand-orange">*</span>
                    </span>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => {
                        setContactForm((prev) => ({ ...prev, name: e.target.value }))
                        if (contactError) setContactError('')
                      }}
                      placeholder="e.g. Ramesh Patel"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-left">
                    <span className="text-xs font-semibold text-slate-700">
                      {t('contactEmailLabel')} <span className="text-brand-orange">*</span>
                    </span>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => {
                        setContactForm((prev) => ({ ...prev, email: e.target.value }))
                        if (contactError) setContactError('')
                      }}
                      placeholder="e.g. ramesh@kirana.com"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-left">
                  <span className="text-xs font-semibold text-slate-700">
                    Your Business Role
                  </span>
                  <select
                    value={contactForm.role}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all"
                  >
                    <option value="SHOP_OWNER">Retail Shop Owner (Kirana, General Store)</option>
                    <option value="SUPPLIER">Wholesale Supplier / Distributor</option>
                    <option value="OTHER">Partnership / Other Inquiry</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-left">
                  <span className="text-xs font-semibold text-slate-700">
                    {t('contactMessageLabel')} <span className="text-brand-orange">*</span>
                  </span>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => {
                      setContactForm((prev) => ({ ...prev, message: e.target.value }))
                      if (contactError) setContactError('')
                    }}
                    placeholder="Tell us what you need help with or questions about Connekto..."
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all resize-y"
                  />
                </label>

                {contactError && (
                  <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl" role="alert">
                    {contactError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={contactStatus === 'submitting'}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-brand-orange hover:bg-brand-orange-dark shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{contactStatus === 'submitting' ? t('contactSending') : t('contactSendMessage')}</span>
                  <FiSend className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── VIDEO WALKTHROUGH MODAL ── */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-label="Connekto platform overview"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Connekto Platform Tour
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 bg-white border border-slate-200/60 transition-colors cursor-pointer"
                aria-label="Close video tour"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Video Walkthrough Container */}
            <div className="p-5 sm:p-7 space-y-4">
              <div
                ref={videoContainerRef}
                className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 flex flex-col items-center justify-center text-white group shadow-inner"
              >
                {/* HTML5 Video Element */}
                <video
                  ref={videoRef}
                  src="/demo-walkthrough.mp4"
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={togglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.target.duration || 90)}
                  onEnded={() => {
                    setIsPlaying(false)
                    setHasEnded(true)
                  }}
                  onError={() => setVideoError(true)}
                />

                {/* Big Center Play / Restart overlay button when paused or ended */}
                {(!isPlaying || hasEnded) && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-orange/95 hover:bg-brand-orange text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer z-10"
                    aria-label={hasEnded ? 'Replay walkthrough' : 'Play walkthrough'}
                  >
                    {hasEnded ? (
                      <FiRotateCcw className="w-7 h-7 sm:w-8 sm:h-8" />
                    ) : (
                      <FiPlay className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                    )}
                  </button>
                )}

                {/* Custom Overlay Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 pt-6 flex flex-col gap-2 z-10">
                  {/* Progress scrubber */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 90}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                    aria-label="Video scrubber"
                  />

                  {/* Controls row */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="hover:text-brand-orange transition-colors cursor-pointer"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <FiPause className="w-4 h-4 fill-current" />
                        ) : hasEnded ? (
                          <FiRotateCcw className="w-4 h-4" />
                        ) : (
                          <FiPlay className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMute}
                        className="hover:text-brand-orange transition-colors cursor-pointer"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <FiVolumeX className="w-4 h-4" />
                        ) : (
                          <FiVolume2 className="w-4 h-4" />
                        )}
                      </button>

                      <span className="font-mono text-[11px] sm:text-xs text-slate-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                        1080p HD
                      </span>
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="hover:text-brand-orange transition-colors cursor-pointer"
                        aria-label="Toggle fullscreen"
                      >
                        <FiMaximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tour Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100 space-y-1">
                  <strong className="block text-xs font-bold text-slate-900">1. Instant Catalog</strong>
                  <p className="text-[11px] text-slate-500">Live stock and wholesale prices from verified suppliers.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <strong className="block text-xs font-bold text-slate-900">2. Split Orders</strong>
                  <p className="text-[11px] text-slate-500">Shop across distributors and checkout in a single cart.</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <strong className="block text-xs font-bold text-slate-900">3. Live Tracking</strong>
                  <p className="text-[11px] text-slate-500">Real-time status updates as your shipment moves.</p>
                </div>
              </div>

              {/* Action in Modal */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Ready to join your local network?</p>
                <Link
                  to="/role-selection"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-center text-xs sm:text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{t('getStarted')}</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

