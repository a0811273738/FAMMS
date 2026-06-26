'use client'

import { ReactNode, useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/config'

interface I18nProviderProps {
  children: ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize i18n if not already done
    if (!i18n.isInitialized) {
      i18n.init().then(() => setIsReady(true))
    } else {
      setIsReady(true)
    }
  }, [])

  if (!isReady) {
    return <>{children}</>
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
