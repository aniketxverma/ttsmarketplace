import { BrandDirectory } from '@/components/marketplace/BrandDirectory'

export const metadata = {
  title: 'Suppliers · TTAI EMA',
  description: 'Find trusted suppliers worldwide — verified manufacturers, reliable partners, endless business opportunities.',
  openGraph: {
    title: 'Find Trusted Suppliers Worldwide · TTAI EMA',
    description: 'Connect with verified suppliers, manufacturers and wholesalers across the globe. Verified suppliers, real business connections, global market access.',
    images: [{ url: '/og-suppliers.jpg', width: 1718, height: 915, alt: 'TTAIZ — Find Trusted Suppliers Worldwide' }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-suppliers.jpg'] },
}

export default function SuppliersPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string; industry?: string }
}) {
  return <BrandDirectory kind="supplier" searchParams={searchParams} />
}
