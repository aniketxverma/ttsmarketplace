import { BrandDirectory } from '@/components/marketplace/BrandDirectory'

export const metadata = { title: 'Distributors · TTAI EMA' }

export default function DistributorsPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string }
}) {
  return <BrandDirectory kind="distributor" searchParams={searchParams} />
}
