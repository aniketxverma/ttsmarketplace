/**
 * Shared i18n utilities — safe to import from BOTH server and client components.
 * This file must never import from 'next/headers', 'next/cookies', or any other
 * server-only package so client.tsx can import from here without breaking builds.
 */

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

/** Dot-notation getter — t('brand.tab_products') */
export function createT(messages: Messages) {
  return function t(key: string): string {
    // Exact top-level match first — lets us key client UI by the English text
    // itself (including phrases with spaces or periods, which dot-splitting breaks).
    const exact = (messages as Record<string, unknown>)[key]
    if (typeof exact === 'string') return exact
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
