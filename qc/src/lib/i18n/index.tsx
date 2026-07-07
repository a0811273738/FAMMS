'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import zh from './locales/zh.json'
import en from './locales/en.json'
import id from './locales/id.json'

export type Locale = 'zh' | 'en' | 'id'

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'id', label: 'Bahasa' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
]

const DICTS: Record<Locale, unknown> = { zh, en, id }
const STORAGE_KEY = 'fqms_lang'

// Resolve a dot-path ('nav.tasks') against a nested dictionary.
function lookup(dict: unknown, key: string): string | undefined {
  const v = key.split('.').reduce<unknown>(
    (acc, part) => (acc == null ? undefined : (acc as Record<string, unknown>)[part]),
    dict,
  )
  return typeof v === 'string' ? v : undefined
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Inspectors default to Bahasa Indonesia (ch.5.2 rule #10).
  const [locale, setLocaleState] = useState<Locale>('id')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved === 'zh' || saved === 'en' || saved === 'id') {
      setLocaleState(saved)
      return
    }
    const nav = (navigator.language || '').toLowerCase()
    if (nav.startsWith('zh')) setLocaleState('zh')
    else if (nav.startsWith('en')) setLocaleState('en')
    // anything else (incl. 'id') keeps the Bahasa Indonesia default
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, l)
  }, [])

  // t() falls back to the id value, then the explicit fallback, then the key.
  const t = useCallback((key: string, fallback?: string): string => {
    return lookup(DICTS[locale], key) ?? lookup(DICTS.id, key) ?? fallback ?? key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    return {
      locale: 'id',
      setLocale: () => {},
      t: (key: string, fallback?: string) => lookup(DICTS.id, key) ?? fallback ?? key,
    }
  }
  return ctx
}
