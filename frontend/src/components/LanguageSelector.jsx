import { useLocale } from '../context/LocaleContext.jsx'
import { supportedLocales } from '../utils/translations.js'

export default function LanguageSelector() {
  const { locale, setLocale, t } = useLocale()
  return (
    <label className="inline-flex items-center">
      <span className="sr-only">{t('selectLanguage')}</span>
      <select
        aria-label={t('selectLanguage')}
        className="text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer shadow-2xs"
        onChange={(event) => setLocale(event.target.value)}
        value={locale}
      >
        {supportedLocales.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
