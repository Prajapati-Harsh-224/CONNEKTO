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
    <nav className="pub-nav" aria-label="Primary navigation">
      {navLinks.map((item) => {
        if (item.path) {
          return (
            <Link
              key={item.key}
              className={location.pathname === item.path ? 'active' : ''}
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
            onClick={e => { e.preventDefault(); scrollToSection(item.id) }}
          >
            {t(item.key)}
          </a>
        )
      })}
    </nav>
  )
}
