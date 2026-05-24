export type Locale = 'en' | 'es' | 'ar' | 'fr' | 'de' | 'pt'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'es', 'ar', 'fr', 'de', 'pt']

export const DEFAULT_LOCALE: Locale = 'en'

/** ISO 3166-1 alpha-2 country → locale */
export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
  VE: 'es', EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es',
  HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es',
  UY: 'es', GQ: 'es',

  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', IQ: 'ar', JO: 'ar', KW: 'ar',
  LB: 'ar', LY: 'ar', MA: 'ar', OM: 'ar', QA: 'ar', SD: 'ar',
  SY: 'ar', TN: 'ar', YE: 'ar', DZ: 'ar', BH: 'ar', PS: 'ar',
  SO: 'ar', MR: 'ar', KM: 'ar', DJ: 'ar',

  // French
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr',
  SN: 'fr', CI: 'fr', ML: 'fr', BF: 'fr', GN: 'fr',
  NE: 'fr', TG: 'fr', BJ: 'fr', GA: 'fr', CG: 'fr',
  CD: 'fr', CM: 'fr', MG: 'fr', RW: 'fr', BI: 'fr',
  MU: 'fr', SC: 'fr', HT: 'fr', GF: 'fr', GP: 'fr',
  MQ: 'fr', RE: 'fr', PM: 'fr', NC: 'fr', PF: 'fr',

  // German
  DE: 'de', AT: 'de', LI: 'de',

  // Portuguese
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt',
  GW: 'pt', ST: 'pt', TL: 'pt',
  // GQ (Equatorial Guinea) → Spanish (official); Portuguese spoken too but ES more common
}

/** Parse Accept-Language header and return best matching locale */
export function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  const parts = header.split(',').map(s => {
    const [lang, q] = s.trim().split(';q=')
    return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 }
  }).sort((a, b) => b.q - a.q)

  for (const { lang } of parts) {
    const short = lang.split('-')[0]
    if (short === 'es') return 'es'
    if (short === 'ar') return 'ar'
    if (short === 'fr') return 'fr'
    if (short === 'de') return 'de'
    if (short === 'pt') return 'pt'
    if (short === 'en') return 'en'
  }
  return null
}
