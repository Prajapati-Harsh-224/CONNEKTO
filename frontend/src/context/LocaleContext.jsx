import { createContext, useContext, useState } from 'react'
import { getStoredLocale, saveLocale } from '../utils/localeStorage.js'
import { translations } from '../utils/translations.js'

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale)

  function setLocale(nextLocale) {
    saveLocale(nextLocale)
    setLocaleState(nextLocale)
  }

  function translate(key, values = {}) {
    const template = translations[locale][key] || translations.en[key] || key
    return Object.entries(values).reduce((result, [token, value]) => result.replaceAll(`{${token}}`, String(value)), template)
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t: translate, messages: translations[locale] }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
