import { useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiArrowRight, FiPlay, FiShoppingBag, FiTruck, FiUsers, FiMail, FiMapPin } from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'
import homeHeroBg from '../assets/Home_Hero.png'
import contactIllustration from '../assets/contact_illustration.svg'

export default function WelcomePage() {
  const { t } = useLocale()
  const location = useLocation()

  const scrollTo = useCallback((id) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    const sectionMap = {
      '/about': 'about',
      '/for-businesses': 'for-businesses',
      '/how-it-works': 'how-it-works',
      '/contact': 'contact',
    }
    const targetId = sectionMap[location.pathname] || (location.hash ? location.hash.replace('#', '') : null)
    if (targetId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 60)
      return () => clearTimeout(timer)
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname, location.hash])

  return (
    <div className="w-full min-h-screen bg-brand-cream/30 text-slate-800 selection:bg-brand-orange/20 selection:text-brand-orange">

      {/* ── HERO SECTION ── */}
      <section className="relative w-full overflow-hidden pt-6 sm:pt-12 pb-24 sm:pb-36 lg:pb-40 min-h-[520px] sm:min-h-[580px] lg:min-h-[640px]" id="home" aria-label="Hero">
        {/* Full Hero Background Image */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center sm:bg-[position:65%_center] lg:bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${homeHeroBg})`,
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />

        {/* Subtle overlay/gradient for readability */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-white/10 sm:from-white/80 sm:via-white/40 sm:to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Hero Content Layer */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl lg:max-w-3xl space-y-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-orange bg-orange-50 border border-orange-200 shadow-xs">
              {t('heroEyebrow')}
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-[1.15]">
              {t('heroHeading')}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-dark active:scale-95 shadow-md shadow-brand-orange/20 transition-all"
                to="/role-selection"
              >
                <span>{t('getStarted')}</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 active:scale-95 shadow-xs transition-all cursor-pointer"
                to="/how-it-works"
                onClick={() => scrollTo('how-it-works')}
              >
                <span className="w-6 h-6 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center">
                  <FiPlay className="w-3 h-3 fill-current ml-0.5" />
                </span>
                <span>{t('watchVideo')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE SELECTION (FOR BUSINESSES) ── */}
      <section className="py-14 sm:py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8" id="for-businesses" aria-labelledby="roles-heading">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('chooseYourRoleEyebrow')}</span>
            <h2 id="roles-heading" className="text-2xl sm:text-4xl font-extrabold text-brand-navy">{t('joinConnekto')}</h2>
            <p className="text-sm sm:text-base text-slate-500">{t('joinConnektoDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shop Owner */}
            <Link
              to="/role-selection?role=SHOP_OWNER"
              aria-label={t('shopOwner')}
              className="group p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-orange hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xs"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center border border-orange-200/60 shadow-xs group-hover:scale-110 transition-transform">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <strong className="block text-lg font-bold text-slate-900 group-hover:text-brand-orange transition-colors">{t('shopOwner')}</strong>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{t('shopOwnerHomeDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-orange">
                <span>{t('getStarted')}</span>
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Supplier */}
            <Link
              to="/role-selection?role=SUPPLIER"
              aria-label={t('supplier')}
              className="group p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-600 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xs"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shadow-xs group-hover:scale-110 transition-transform">
                  <FiTruck className="w-6 h-6" />
                </div>
                <div>
                  <strong className="block text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{t('supplier')}</strong>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{t('supplierHomeDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span>{t('getStarted')}</span>
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Gruh Udyog */}
            <Link
              to="/role-selection?role=GRUH_UDYOG"
              aria-label={t('gruhUdyog')}
              className="group p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-600 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xs"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60 shadow-xs group-hover:scale-110 transition-transform">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <strong className="block text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{t('gruhUdyog')}</strong>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{t('gruhUdyogHomeDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-purple-700">
                <span>{t('getStarted')}</span>
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* ── ABOUT SECTION ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="about" aria-labelledby="about-heading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('aboutEyebrow')}</span>
            <h2 id="about-heading" className="text-2xl sm:text-4xl font-extrabold text-brand-navy">{t('aboutHeading')}</h2>
            <div className="space-y-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              <p>{t('aboutBody1')}</p>
              <p>{t('aboutBody2')}</p>
              <p>{t('aboutBody3')}</p>
              <p>{t('aboutBody4')}</p>
            </div>
            <p className="text-sm sm:text-base font-semibold text-brand-navy pt-2">{t('aboutClosing')}</p>
            <div className="pt-2">
              <Link
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-dark active:scale-95 shadow-sm transition-all"
                to="/role-selection"
              >
                <span>{t('getStarted')}</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Role Diagram / Visual */}
          <div className="lg:col-span-5 flex justify-center" aria-hidden="true">
            <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white text-xl font-black mx-auto flex items-center justify-center shadow-md">
                C
              </div>
              <h3 className="text-xl font-black text-brand-navy">Connekto</h3>
              <p className="text-xs text-slate-500">Unified local commerce ecosystem connecting retailers, suppliers, and producers.</p>

              <div className="grid grid-cols-1 gap-2.5 pt-4 text-left">
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

                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="w-8 h-8 rounded-lg bg-white text-purple-600 flex items-center justify-center shadow-xs">
                    <FiUsers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-xs font-bold text-slate-900">{t('gruhUdyog')}</strong>
                    <span className="block text-[11px] text-slate-500 truncate">{t('aboutGruhUdyogShort1')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8" id="how-it-works" aria-labelledby="hiw-heading">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('hiwEyebrow')}</span>
            <h2 id="hiw-heading" className="text-2xl sm:text-4xl font-extrabold text-brand-navy">{t('hiwHeading')}</h2>
            <p className="text-sm sm:text-base text-slate-500">{t('hiwSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', titleKey: 'hiwStep1Title', descKey: 'hiwStep1Desc' },
              { num: '02', titleKey: 'hiwStep2Title', descKey: 'hiwStep2Desc' },
              { num: '03', titleKey: 'hiwStep3Title', descKey: 'hiwStep3Desc' },
              { num: '04', titleKey: 'hiwStep4Title', descKey: 'hiwStep4Desc' },
            ].map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative hover:bg-white hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="text-3xl font-black text-brand-orange/25">{step.num}</div>
                <strong className="block text-base font-bold text-slate-900">{t(step.titleKey)}</strong>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="contact" aria-labelledby="contact-heading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('contactEyebrow')}</span>
            <h2 id="contact-heading" className="text-2xl sm:text-4xl font-extrabold text-brand-navy">{t('contactHeading')}</h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{t('contactSubtitle')}</p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-200/60 shadow-xs">
                  <FiMail className="w-4 h-4" />
                </div>
                <a className="font-semibold text-brand-orange hover:underline" href="mailto:hello@connekto.example">
                  hello@connekto.example
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-200/60 shadow-xs">
                  <FiMapPin className="w-4 h-4" />
                </div>
                <span>{t('contactLocation')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <img
              alt="Contact illustration showing email, questions, ideas, and partnerships"
              className="w-full max-w-md h-auto"
              src={contactIllustration}
            />
          </div>
        </div>
      </section>

    </div>
  )
}
