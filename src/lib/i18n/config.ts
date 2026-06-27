import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import idTranslations from './locales/id.json'
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'

const resources = {
  id: { translation: idTranslations },
  en: { translation: enTranslations },
  zh: { translation: zhTranslations },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    defaultNS: 'translation',
    ns: ['translation'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
