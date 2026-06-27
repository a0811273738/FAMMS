import i18n from 'i18next'
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
  .use(initReactI18next)
  .init({
    resources,
    lng: 'id',
    fallbackLng: 'id',
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: { escapeValue: false },
  })

export default i18n
