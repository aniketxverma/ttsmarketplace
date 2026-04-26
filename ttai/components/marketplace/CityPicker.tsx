import Link from 'next/link'

interface City {
  id: string
  name: string
  slug: string
}

export function CityPicker({ cities }: { cities: City[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {cities.map((city) => (
        <Link
          key={city.id}
          href={`/store/${city.slug}`}
          className="bg-card rounded-xl border p-6 text-center hover:shadow-md hover:border-primary/40 transition-all group"
        >
          <div className="text-3xl mb-2">🏙️</div>
          <p className="font-semibold group-hover:text-primary transition-colors">{city.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Shop local</p>
        </Link>
      ))}
    </div>
  )
}
