'use client'

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import type { Messages } from './utils'
import { createT } from './utils'
import type { Locale } from './locales'

interface I18nContextValue {
  locale: Locale
  messages: Messages
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: Messages
  children: ReactNode
}) {
  const t = createT(messages)
  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Fallback — return key as-is if used outside provider
    return (key: string) => key
  }
  return ctx.t
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext)
  return ctx?.locale ?? 'en'
}

export function useMessages(): Messages | null {
  return useContext(I18nContext)?.messages ?? null
}
