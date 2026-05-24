import { cookies } from 'next/headers'
import type { Locale } from './locales'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales'

export type Messages = typeof import('./messages/en').default

type DotPath<T, Prefix extends string = ''> = T extends object
  ? { [K in keyof T & string]:
      T[K] extends Array<infer _U>
        ? `${Prefix}${K}`
        : T[K] extends object
          ? DotPath<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
    }[keyof T & string]
  : never

export type MessageKey = DotPath<Messages>

/**
 * Read the current locale from the TTAI_LOCALE cookie (set by middleware).
 * Wrapped in try/catch so it never throws during ISR background revalidation,
 * where there is no request context and cookies() would otherwise throw.
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
    default:   return (await import('./messages/en')).default as Messages
  }
}

/** Dot-notation getter — t('brand.tab_products') */
export function createT(messages: Messages) {
  return function t(key: string): string {
    const parts = key.split('.')
    let val: unknown = messages
    for (const part of parts) {
      if (val == null || typeof val !== 'object') return key
      val = (val as Record<string, unknown>)[part]
    }
    if (typeof val === 'string') return val
    return key
  }
}

/** Convenience: get locale + messages + t() in one call for server components */
export async function useServerTranslations() {
  const locale = getLocale()           // synchronous — safe in ISR context
  const messages = await getMessages(locale)
  const t = createT(messages)
  return { locale, messages, t }
}
