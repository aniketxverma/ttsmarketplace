/**
 * Maps a company's continent + country (collected at registration) to the
 * region keys used by `supplier_regions` — enabling automatic placement:
 * a supplier set to "Middle East / Saudi Arabia" surfaces under both
 *   region_key = 'middle-east'  and  region_key = 'middle-east:saudi-arabia'.
 */

const CONTINENT_REGION: Record<string, string> = {
  'Europe':        'europe',
  'Middle East':   'middle-east',
  'Africa':        'africa',
  'Americas':      'americas',
  'North America': 'americas',
  'South America': 'americas',
  'Asia Pacific':  'asia',
  'Asia':          'asia',
  'Oceania':       'asia',
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** 'Europe' → 'europe', 'Middle East' → 'middle-east' (null if unmapped). */
export function continentToRegionKey(continent?: string | null): string | null {
  if (!continent) return null
  return CONTINENT_REGION[continent.trim()] ?? slugify(continent)
}

/** 'Europe' + 'Spain' → 'europe:spain' (null if region unknown). */
export function regionCountryKey(continent?: string | null, country?: string | null): string | null {
  const region = continentToRegionKey(continent)
  if (!region || !country) return null
  return `${region}:${slugify(country)}`
}

/** All region keys a company belongs to, from continent + country. */
export function regionKeysFor(continent?: string | null, country?: string | null): string[] {
  const keys: string[] = []
  const region = continentToRegionKey(continent)
  if (region) keys.push(region)
  const cc = regionCountryKey(continent, country)
  if (cc) keys.push(cc)
  return keys
}
