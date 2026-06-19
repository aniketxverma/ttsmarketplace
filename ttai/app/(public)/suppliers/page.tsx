import { BrandDirectory } from '@/components/marketplace/BrandDirectory'

export const metadata = { title: 'Suppliers · TTAI EMA' }

export default function SuppliersPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string; industry?: string }
}) {
  return <BrandDirectory kind="supplier" searchParams={searchParams} />
}
