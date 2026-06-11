// Market regions for the marketplace banner + retail rollout.
// Europe is live; flip `enabled: true` on a region to roll it out. Adding a region
// or country is a pure data edit here — no component changes needed.

export interface MarketCountry { iso: string; name: string; flag: string }
export interface MarketRegion {
  id: string
  name: string
  enabled: boolean
  /** ISO of the country the Retail Shop defaults to for this region. */
  retailDefaultIso: string
  countries: MarketCountry[]
}

export const MARKET_REGIONS: MarketRegion[] = [
  {
    id: 'europe', name: 'Europe', enabled: true, retailDefaultIso: 'ES',
    countries: [
      { iso: 'ES', name: 'Spain',          flag: '🇪🇸' },
      { iso: 'DE', name: 'Germany',        flag: '🇩🇪' },
      { iso: 'FR', name: 'France',         flag: '🇫🇷' },
      { iso: 'IT', name: 'Italy',          flag: '🇮🇹' },
      { iso: 'BE', name: 'Belgium',        flag: '🇧🇪' },
      { iso: 'NL', name: 'Netherlands',    flag: '🇳🇱' },
      { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    ],
  },
  {
    id: 'middle-east', name: 'Middle East', enabled: false, retailDefaultIso: 'AE',
    countries: [
      { iso: 'AE', name: 'UAE',           flag: '🇦🇪' },
      { iso: 'SA', name: 'Saudi Arabia',  flag: '🇸🇦' },
      { iso: 'QA', name: 'Qatar',         flag: '🇶🇦' },
      { iso: 'TR', name: 'Türkiye',       flag: '🇹🇷' },
    ],
  },
  {
    id: 'usa', name: 'USA', enabled: false, retailDefaultIso: 'US',
    countries: [{ iso: 'US', name: 'United States', flag: '🇺🇸' }],
  },
  {
    id: 'africa', name: 'Africa', enabled: false, retailDefaultIso: 'MA',
    countries: [
      { iso: 'MA', name: 'Morocco',      flag: '🇲🇦' },
      { iso: 'EG', name: 'Egypt',        flag: '🇪🇬' },
      { iso: 'NG', name: 'Nigeria',      flag: '🇳🇬' },
      { iso: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    ],
  },
  {
    id: 'asia', name: 'Asia', enabled: false, retailDefaultIso: 'CN',
    countries: [
      { iso: 'CN', name: 'China', flag: '🇨🇳' },
      { iso: 'IN', name: 'India', flag: '🇮🇳' },
      { iso: 'AE', name: 'UAE',   flag: '🇦🇪' },
    ],
  },
]

export const DEFAULT_REGION_ID = 'europe'

export function getRegion(id?: string | null): MarketRegion {
  return MARKET_REGIONS.find((r) => r.id === id && r.enabled)
    ?? MARKET_REGIONS.find((r) => r.id === DEFAULT_REGION_ID)!
}
