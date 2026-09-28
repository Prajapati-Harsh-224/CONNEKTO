import { createContext, useContext, useState } from 'react'
import { getStoredLocale, saveLocale } from '../utils/localeStorage.js'
import { translations } from '../utils/translations.js'

const LocaleContext = createContext(null)

function formatVariableKey(key) {
  if (typeof key !== 'string' || !key) return ''
  if (key.includes(' ') || key.includes('-')) return key
  const unCamel = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  return unCamel.charAt(0).toUpperCase() + unCamel.slice(1)
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale)

  function setLocale(nextLocale) {
    saveLocale(nextLocale)
    setLocaleState(nextLocale)
  }

  function translate(key, values = {}) {
    const template = translations[locale]?.[key] || translations.en?.[key] || formatVariableKey(key)
    const safeValues = values && typeof values === 'object' ? values : {}
    return Object.entries(safeValues).reduce((result, [token, value]) => result.replaceAll(`{${token}}`, String(value)), template)
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t: translate, messages: translations[locale] }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
