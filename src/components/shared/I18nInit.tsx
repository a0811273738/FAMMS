'use client'

import { useEffect } from 'react'
import i18n from '@/lib/i18n/config'

const SUPPORTED = ['id', 'en', 'zh']

export default function I18nInit() {
  useEffect(() => {
    const saved = localStorage.getItem('famms_lang')
    if (saved && SUPPORTED.includes(saved) && saved !== i18n.language) {
      i18n.changeLanguage(saved)
    }
  }, [])
  return null
}
