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
      className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-slate-100 border border-slate-200 shadow-2xs shrink-0"
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
                ? 'bg-brand-orange text-white font-bold shadow-xs shadow-brand-orange/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
