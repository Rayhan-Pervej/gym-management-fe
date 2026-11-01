import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import en from '@/locales/en.json'
import bn from '@/locales/bn.json'
import type { Locale } from '@/core/api/types'

const KEY = 'gf-lang'
const initial = (localStorage.getItem(KEY) as Locale) || 'bn'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = initial

export const setLanguage = (l: Locale) => {
  localStorage.setItem(KEY, l)
  document.documentElement.lang = l
  i18n.changeLanguage(l)
}

export const useLang = () => {
  const { i18n: i } = useTranslation()
  return i.language as Locale
}

export default i18n
