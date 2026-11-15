import { useLocale } from '../context/LocaleContext.jsx'

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale()

  const languages = [
    { code: 'en', label: 'EN', fullLabel: 'English' },
    { code: 'gu', label: 'ગુજ', fullLabel: 'ગુજરાતી' },
    { code: 'hi', label: 'हिं', fullLabel: 'हिंदी' },
  ]

  return (
    <div
      role="group"
      aria-label="Language selector"
      className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-slate-900/70 sm:bg-slate-900/50 border border-slate-700/70 sm:border-white/10 backdrop-blur-md shadow-xs shrink-0"
    >
      {languages.map((lang) => {
        const isActive = locale === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLocale(lang.code)}
            aria-pressed={isActive}
            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-xs shadow-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={lang.fullLabel}
          >
            <span className="hidden md:inline">{lang.fullLabel}</span>
            <span className="md:hidden">{lang.label}</span>
          </button>
        )
      })}
    </div>
  )
}
