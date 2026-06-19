import { BrandDirectory } from '@/components/marketplace/BrandDirectory'

export const metadata = { title: 'Factories · TTAI EMA' }

export default function FactoriesPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string; industry?: string }
}) {
  return <BrandDirectory kind="factory" searchParams={searchParams} />
}
