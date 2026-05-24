'use client'

import { useLocale, useT } from '@/lib/i18n/client'
import type { Locale } from '@/lib/i18n/locales'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'

const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  en: { label: 'English',    flag: '🇬🇧' },
  es: { label: 'Español',    flag: '🇪🇸' },
  ar: { label: 'العربية',    flag: '🇸🇦' },
  fr: { label: 'Français',   flag: '🇫🇷' },
  de: { label: 'Deutsch',    flag: '🇩🇪' },
  pt: { label: 'Português',  flag: '🇵🇹' },
}

export function LocaleSwitcher({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const locale = useLocale()
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  function setLocale(next: Locale) {
    // Write the cookie client-side — middleware will respect it on next navigation
    document.cookie = `TTAI_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    setOpen(false)
    startTransition(() => {
      router.refresh()
    })
  }

  const current = LOCALE_LABELS[locale]
  const btnClass = variant === 'light'
    ? 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors'
    : 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={btnClass}
        aria-label={t('nav.language')}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:block">{current.label}</span>
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 16 16">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-50
            bg-[#0D1526] border border-white/10 rounded-xl shadow-2xl
            min-w-[160px] overflow-hidden py-1">
            {SUPPORTED_LOCALES.map(l => {
              const { label, flag } = LOCALE_LABELS[l]
              const isActive = l === locale
              return (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`
                    w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left
                    transition-colors
                    ${isActive
                      ? 'text-[#C9A84C] bg-white/5 font-medium'
                      : 'text-white/75 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <span className="text-base leading-none">{flag}</span>
                  <span>{label}</span>
                  {isActive && (
                    <svg className="ml-auto w-3.5 h-3.5 text-[#C9A84C]" fill="none" viewBox="0 0 16 16">
                      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
