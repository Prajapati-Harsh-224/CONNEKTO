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
        className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs sm:text-sm font-medium text-slate-600"
        aria-label="Primary navigation"
      >
        {navLinks.map((item) => {
          const isActive = activeSection === item.id
          const baseClass =
            'px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs sm:text-sm'
          const activeClass = isActive
            ? 'text-brand-orange font-bold bg-brand-orange-light shadow-2xs'
            : 'hover:text-slate-900 hover:bg-slate-100/70'

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
          className="hidden lg:inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/60 transition-colors"
          to={registerUrl}
        >
          {t('signUp')}
        </Link>

        {/* Sign In CTA button (hidden on xs, shown on md+) */}
        <Link
          className="hidden md:inline-flex px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs hover:shadow-sm active:scale-95 transition-all items-center gap-1.5"
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
          className={`lg:hidden p-2 rounded-xl text-slate-700 hover:text-brand-orange hover:bg-slate-100 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
            isOpen
              ? 'bg-orange-50 text-brand-orange ring-1 ring-orange-200'
              : 'bg-slate-50 border border-slate-200/80'
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
          className="lg:hidden fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
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
          className="lg:hidden absolute top-16 left-0 right-0 w-full bg-white/98 backdrop-blur-xl border-b border-slate-200 shadow-2xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          {/* Section Navigation Links */}
          <div className="p-3 sm:p-4 space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                      ? 'bg-brand-orange-light text-brand-orange shadow-2xs font-bold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-white text-brand-orange shadow-2xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{t(item.key) || item.defaultLabel}</span>
                  </div>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-brand-orange" />
                  ) : (
                    <FiChevronRight className="w-4 h-4 text-slate-300" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Action Buttons in Dropdown */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to={registerUrl}
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all active:scale-[0.99]"
              >
                {t('signUp')}
              </Link>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-dark shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
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
