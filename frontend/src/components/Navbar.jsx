import { Link, useLocation } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.jsx'

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Navbar() {
  const location = useLocation()
  const { t } = useLocale()

  const navLinks = [
    { key: 'home', id: 'home', path: '/', exact: true },
    { key: 'about', id: 'about' },
    { key: 'forBusinesses', id: 'for-businesses' },
    { key: 'howItWorks', id: 'how-it-works' },
    { key: 'contact', id: 'contact' },
  ]

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs sm:text-sm font-medium text-slate-600" aria-label="Primary navigation">
      {navLinks.map((item) => {
        const isActive = item.path && location.pathname === item.path
        const baseClass = "px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        const activeClass = isActive ? "text-[#f06535] font-semibold bg-orange-50" : "hover:text-slate-900 hover:bg-slate-100/60"

        if (item.path) {
          return (
            <Link
              key={item.key}
              className={`${baseClass} ${activeClass}`}
              to={item.path}
            >
              {t(item.key)}
            </Link>
          )
        }
        return (
          <a
            key={item.key}
            href={`#${item.id}`}
            className={`${baseClass} ${activeClass}`}
            onClick={e => { e.preventDefault(); scrollToSection(item.id) }}
          >
            {t(item.key)}
          </a>
        )
      })}
    </nav>
  )
}
