/**
 * SERVER-ONLY i18n helpers.
 *
 * ⚠️  Do NOT import this file from a 'use client' component.
 *     Pure utilities (Messages type, createT) live in ./utils so that
 *     client.tsx can import them without pulling next/headers into the
 *     client bundle and breaking the build.
 */
import { cookies } from 'next/headers'
import type { Locale } from './locales'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales'
import { createT } from './utils'
import type { Messages } from './utils'

// Re-export so existing callers can keep `import ... from '@/lib/i18n/server'`
export type { Messages, MessageKey } from './utils'
export { createT } from './utils'

/**
 * Read the current locale from the TTAI_LOCALE cookie (set by middleware).
 * Wrapped in try/catch — cookies() throws during ISR background revalidation
 * (no request context). Falls back to DEFAULT_LOCALE in that case.
 */
export function getLocale(): Locale {
  try {
    const cookieStore = cookies()
    const saved = cookieStore.get('TTAI_LOCALE')?.value
    if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) return saved as Locale
  } catch {
    // ISR background revalidation has no request context — fall through to default
  }
  return DEFAULT_LOCALE
}

/** Load the full messages object for a locale */
export async function getMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'es': return (await import('./messages/es')).default as unknown as Messages
    case 'ar': return (await import('./messages/ar')).default as unknown as Messages
    case 'fr': return (await import('./messages/fr')).default as unknown as Messages
    case 'de': return (await import('./messages/de')).default as unknown as Messages
    case 'pt': return (await import('./messages/pt')).default as unknown as Messages
    case 'ru': return (await import('./messages/ru')).default as unknown as Messages
    case 'fa': return (await import('./messages/fa')).default as unknown as Messages
    default:   return (await import('./messages/en')).default as Messages
  }
}

/** Convenience: get locale + messages + t() in one call for server components */
export async function useServerTranslations() {
  const locale = getLocale()
  const messages = await getMessages(locale)
  const t = createT(messages)
  return { locale, messages, t }
}
