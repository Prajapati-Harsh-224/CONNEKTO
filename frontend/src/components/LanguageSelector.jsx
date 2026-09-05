import { useLocale } from '../context/LocaleContext.jsx'
import { supportedLocales } from '../utils/translations.js'

export default function LanguageSelector() {
  const { locale, setLocale, t } = useLocale()
  return <label className="language-selector"><span className="sr-only">{t('selectLanguage')}</span><select aria-label={t('selectLanguage')} onChange={(event) => setLocale(event.target.value)} value={locale}>{supportedLocales.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label>
}
