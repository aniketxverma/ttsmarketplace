// Directory of industrial parks / zones per city. A supplier is assigned to one
// (suppliers.industrial_park = slug); cities without a preset get one default park.
export type IndustrialParkDef = { slug: string; name: string; area: string; count: number }

export const PARKS_BY_CITY: Record<string, IndustrialParkDef[]> = {
  madrid: [
    { slug: 'cobo-calleja', name: 'Polígono Cobo Calleja', area: 'Fuenlabrada, Madrid – Spain', count: 325 },
    { slug: 'vallecas', name: 'Polígono Vallecas', area: 'Madrid – Spain', count: 218 },
    { slug: 'villaverde', name: 'Polígono Villaverde', area: 'Madrid – Spain', count: 156 },
    { slug: 'alcobendas', name: 'Polígono Alcobendas', area: 'Alcobendas, Madrid – Spain', count: 189 },
    { slug: 'san-fernando', name: 'Polígono San Fernando', area: 'San Fernando, Madrid – Spain', count: 98 },
  ],
  granada: [{ slug: 'juncaril', name: 'Polígono Juncaril', area: 'Albolote, Granada – Spain', count: 140 }],
  shenzhen: [{ slug: 'baoan', name: "Bao'an Industrial Park", area: "Bao'an, Shenzhen – China", count: 520 }],
}

export function parksForCity(cityName?: string | null, countryName?: string | null): IndustrialParkDef[] {
  const key = (cityName ?? '').toLowerCase().trim()
  if (PARKS_BY_CITY[key]) return PARKS_BY_CITY[key]
  if (cityName) return [{ slug: 'main', name: `${cityName} Industrial Park`, area: `${cityName}${countryName ? ` – ${countryName}` : ''}`, count: 0 }]
  return []
}
