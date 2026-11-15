import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
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

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const menuRef = useRef(null)
  const toggleButtonRef = useRef(null)

  const navLinks = [
    { key: 'home', defaultLabel: 'Home', id: 'home', hash: '#home', icon: FiHome },
    { key: 'about', defaultLabel: 'About', id: 'about', hash: '#about', icon: FiInfo },
    { key: 'howItWorks', defaultLabel: 'How It Works', id: 'how-it-works', hash: '#how-it-works', icon: FiCompass },
    { key: 'contact', defaultLabel: 'Contact', id: 'contact', hash: '#contact', icon: FiMail },
  ]

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Near top of page -> home
      if (window.scrollY < 120) {
        setActiveSection('home')
        return
      }

      // Near bottom of page -> contact
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        setActiveSection('contact')
        return
      }

      // Check sections from bottom to top
      const sectionIds = ['contact', 'how-it-works', 'about']
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          if (window.scrollY + 180 >= elementTop) {
            setActiveSection(id)
            return
          }
        }
      }
      setActiveSection('home')
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync active section with location path/hash
  useEffect(() => {
    const hashSection = location.hash ? location.hash.replace('#', '') : null
    const pathSectionMap = {
      '/': 'home',
      '/about': 'about',
      '/how-it-works': 'how-it-works',
      '/contact': 'contact',
    }
    const section = hashSection || pathSectionMap[location.pathname]
    if (section) {
      setActiveSection(section)
    }
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
        document.body.style.overflow = ''
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        document.body.style.overflow = ''
        setIsOpen(false)
        toggleButtonRef.current?.focus()
      }
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = ''
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

  const handleLinkClick = (e, item) => {
    e.preventDefault()
    setActiveSection(item.id)

    // Unlock body scroll immediately so mobile browsers allow smooth scrolling
    document.body.style.overflow = ''
    setIsOpen(false)

    const isLandingPage =
      location.pathname === '/' ||
      ['/about', '/how-it-works', '/contact'].includes(location.pathname)

    if (item.id === 'home') {
      if (isLandingPage) {
        window.history.pushState(null, '', '/')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate('/')
      }
      return
    }

    if (isLandingPage) {
      window.history.pushState(null, '', item.hash)
      const el = document.getElementById(item.id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate(`/${item.hash}`)
    }
  }

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
            'px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs sm:text-sm font-medium'
          const activeClass = isActive
            ? 'text-brand-orange font-bold bg-orange-50 border border-orange-200/80 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'

          return (
            <a
              key={item.key}
              href={item.hash || '/'}
              className={`${baseClass} ${activeClass}`}
              onClick={(e) => handleLinkClick(e, item)}
            >
              {t(item.key) || item.defaultLabel}
            </a>
          )
        })}
      </nav>

      {/* ── HEADER ACTIONS & MOBILE MENU TOGGLE ── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <LanguageSelector />

        {/* Mobile / Tablet Hamburger Toggle Button (visible on < lg) */}
        <button
          ref={toggleButtonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`lg:hidden p-2 rounded-xl active:scale-95 transition-all focus:outline-none focus-visible:ring-2 ${
            isOpen
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
          className="lg:hidden fixed inset-0 top-16 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => {
            document.body.style.overflow = ''
            setIsOpen(false)
          }}
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
          className="lg:hidden fixed top-16 left-0 right-0 w-full backdrop-blur-2xl border-b border-slate-200 bg-white/98 text-slate-900 shadow-2xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
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
                <a
                  key={item.key}
                  href={item.hash || '/'}
                  onClick={(e) => handleLinkClick(e, item)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-50 text-brand-orange font-bold border border-orange-200/60 shadow-2xs'
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
                    <FiChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
