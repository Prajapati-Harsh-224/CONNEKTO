import { Link, useLocation } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.jsx'

function scrollToSection(id) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Navbar() {
  const location = useLocation()
  const { t } = useLocale()

  const navLinks = [
    { key: 'home', id: 'home', path: '/' },
    { key: 'about', id: 'about', path: '/about' },
    { key: 'forBusinesses', id: 'for-businesses', path: '/for-businesses' },
    { key: 'howItWorks', id: 'how-it-works', path: '/how-it-works' },
    { key: 'contact', id: 'contact', path: '/contact' },
  ]

  const currentPath = location.pathname
  const currentHash = location.hash

  const isItemActive = (item) => {
    if (item.path === '/') {
      return currentPath === '/' && (!currentHash || currentHash === '#home' || currentHash === '#')
    }
    return currentPath === item.path || (currentPath === '/' && currentHash === `#${item.id}`)
  }

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs sm:text-sm font-medium text-slate-600" aria-label="Primary navigation">
      {navLinks.map((item) => {
        const isActive = isItemActive(item)
        const baseClass = "px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        const activeClass = isActive ? "text-[#f06535] font-semibold bg-orange-50" : "hover:text-slate-900 hover:bg-slate-100/60"

        return (
          <Link
            key={item.key}
            className={`${baseClass} ${activeClass}`}
            to={item.path}
            onClick={() => scrollToSection(item.id)}
          >
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}
