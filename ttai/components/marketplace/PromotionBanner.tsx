import Link from 'next/link'

interface Promotion {
  id: string
  custom_pitch: string | null
  products: {
    id: string
    name: string
    product_images: { url: string }[]
  }
  brokers: {
    legal_name: string
  }
}

interface PromotionBannerProps {
  promotions: Promotion[]
}

export function PromotionBanner({ promotions }: PromotionBannerProps) {
  if (!promotions.length) return null

  return (
    <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-4 mb-6">
      <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-3">Featured by Brokers</p>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {promotions.map((promo) => (
          <Link
            key={promo.id}
            href={`/marketplace/${promo.products.id}`}
            className="flex-shrink-0 bg-card rounded-lg border p-3 flex items-center gap-3 hover:shadow-md transition-shadow min-w-[200px]"
          >
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">by {promo.brokers.legal_name}</p>
              <p className="text-sm font-medium line-clamp-1">{promo.products.name}</p>
              {promo.custom_pitch && (
                <p className="text-xs text-muted-foreground line-clamp-2">{promo.custom_pitch}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
