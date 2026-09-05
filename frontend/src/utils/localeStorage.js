const localeKey = 'connecto.locale'
const supportedLocales = ['en', 'hi', 'gu']

export function getStoredLocale() {
  const storedLocale = window.localStorage.getItem(localeKey)
  return supportedLocales.includes(storedLocale) ? storedLocale : 'en'
}

export function saveLocale(locale) {
  if (supportedLocales.includes(locale)) window.localStorage.setItem(localeKey, locale)
}
