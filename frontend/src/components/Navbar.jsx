import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FiArrowRight,
  FiChevronRight,
  FiCompass,
  FiHome,
  FiInfo,
  FiMail,
  FiMenu,
  FiX,
} from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'
import LanguageSelector from './LanguageSelector.jsx'

function scrollToSection(id) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(id)
  if (el) {
    const headerOffset = 70
    const elementPosition = el.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }
}

export default function Navbar() {
  const location = useLocation()
  const { t } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const menuRef = useRef(null)
  const toggleButtonRef = useRef(null)
  const isHome = location.pathname === '/'

  const navLinks = [
    { key: 'home', defaultLabel: 'Home', id: 'home', path: '/', icon: FiHome },
    { key: 'about', defaultLabel: 'About', id: 'about', path: '/', icon: FiInfo },
    { key: 'howItWorks', defaultLabel: 'How It Works', id: 'how-it-works', path: '/', icon: FiCompass },
    { key: 'contact', defaultLabel: 'Contact', id: 'contact', path: '/', icon: FiMail },
  ]

  // Track active section based on scroll position
  useEffect(() => {
    const sectionIds = ['home', 'about', 'how-it-works', 'contact']

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120
      let current = 'home'

      for (const id of sectionIds) {
        if (id === 'home') continue
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop
          if (scrollPosition >= top) {
            current = id
          }
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync active section with location path/hash and close dropdown
  useEffect(() => {
    const pathSectionMap = {
      '/': 'home',
      '/about': 'about',
      '/how-it-works': 'how-it-works',
      '/contact': 'contact',
    }
    const section = pathSectionMap[location.pathname] || (location.hash ? location.hash.replace('#', '') : null)
    if (section) {
      setActiveSection(section)
    }
    setIsOpen(false)
  }, [location.pathname, location.hash])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle click outside, Escape key, and window resize
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        toggleButtonRef.current?.focus()
      }
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  const handleLinkClick = (id) => {
    setActiveSection(id)
    setIsOpen(false)
    scrollToSection(id)
  }

  const registerUrl =
    location.search && location.search.includes('role=')
      ? `/register${location.search}`
      : '/register'

  return (
    <>
      {/* ── DESKTOP HORIZONTAL NAVIGATION (Visible on >= 1024px) ── */}
      <nav
        className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs sm:text-sm font-medium"
        aria-label="Primary navigation"
      >
        {navLinks.map((item) => {
          const isActive = activeSection === item.id
          const baseClass =
            'px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs sm:text-sm'
          const activeClass = isActive
            ? isHome
              ? 'text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 shadow-xs'
              : 'text-brand-orange font-bold bg-brand-orange-light shadow-2xs'
            : isHome
              ? 'text-slate-300 hover:text-white hover:bg-white/10'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'

          return (
            <Link
              key={item.key}
              className={`${baseClass} ${activeClass}`}
              to={item.path}
              onClick={() => handleLinkClick(item.id)}
            >
              {t(item.key) || item.defaultLabel}
            </Link>
          )
        })}
      </nav>

      {/* ── HEADER ACTIONS & MOBILE MENU TOGGLE ── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <LanguageSelector />

        {/* Sign Up Link (hidden on mobile and tablet < lg, shown on desktop lg+) */}
        <Link
          className={`hidden lg:inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            isHome
              ? 'text-slate-300 hover:text-white hover:bg-white/10'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
          to={registerUrl}
        >
          {t('signUp')}
        </Link>

        {/* Sign In CTA button (hidden on xs, shown on md+) */}
        <Link
          className={`hidden md:inline-flex px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold active:scale-95 transition-all items-center gap-1.5 ${
            isHome
              ? 'text-slate-950 font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-sm shadow-emerald-500/20'
              : 'text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs hover:shadow-sm'
          }`}
          to="/login"
        >
          <span>{t('signIn')}</span>
          <span aria-hidden="true">→</span>
        </Link>

        {/* Mobile / Tablet Hamburger Toggle Button (visible on < lg) */}
        <button
          ref={toggleButtonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`lg:hidden p-2 rounded-xl active:scale-95 transition-all focus:outline-none focus-visible:ring-2 ${
            isHome
              ? isOpen
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40 focus-visible:ring-emerald-400'
                : 'bg-slate-900/60 text-slate-200 border border-white/10 hover:bg-white/10 focus-visible:ring-emerald-400'
              : isOpen
                ? 'bg-orange-50 text-brand-orange ring-1 ring-orange-200 focus-visible:ring-brand-orange'
                : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 focus-visible:ring-brand-orange'
          }`}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-dropdown"
          aria-haspopup="dialog"
          aria-label={
            isOpen
              ? t('closeMenu') || 'Close menu'
              : t('menu') || 'Open navigation menu'
          }
        >
          {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── BACKDROP OVERLAY (Mobile & Tablet) ── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE / TABLET DROPDOWN PANEL ── */}
      {isOpen && (
        <div
          ref={menuRef}
          id="mobile-nav-dropdown"
          role="dialog"
          aria-modal="true"
          aria-label={t('navigation') || 'Navigation menu'}
          className={`lg:hidden absolute top-16 left-0 right-0 w-full backdrop-blur-2xl border-b shadow-2xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto ${
            isHome
              ? 'bg-[#090d16]/98 border-white/10 text-white'
              : 'bg-white/98 border-slate-200 text-slate-900'
          }`}
        >
          {/* Section Navigation Links */}
          <div className="p-3 sm:p-4 space-y-1">
            <div className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${isHome ? 'text-slate-400' : 'text-slate-400'}`}>
              {t('navigation') || 'Navigation'}
            </div>
            {navLinks.map((item) => {
              const isActive = activeSection === item.id
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={() => handleLinkClick(item.id)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? isHome
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                        : 'bg-brand-orange-light text-brand-orange shadow-2xs font-bold'
                      : isHome
                        ? 'text-slate-300 hover:text-white hover:bg-white/10'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? isHome
                            ? 'bg-emerald-500/25 text-emerald-300'
                            : 'bg-white text-brand-orange shadow-2xs'
                          : isHome
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{t(item.key) || item.defaultLabel}</span>
                  </div>
                  {isActive ? (
                    <span className={`w-2 h-2 rounded-full ${isHome ? 'bg-emerald-400' : 'bg-brand-orange'}`} />
                  ) : (
                    <FiChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Action Buttons in Dropdown */}
          <div className={`p-4 border-t flex flex-col gap-2.5 ${isHome ? 'border-white/10 bg-slate-900/50' : 'border-slate-200/80 bg-slate-50/80'}`}>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to={registerUrl}
                onClick={() => setIsOpen(false)}
                className={`w-full py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-[0.99] ${
                  isHome
                    ? 'text-slate-200 bg-white/10 border border-white/15 hover:bg-white/15'
                    : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t('signUp')}
              </Link>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className={`w-full py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] ${
                  isHome
                    ? 'text-slate-950 font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/20'
                    : 'text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs'
                }`}
              >
                <span>{t('signIn')}</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
