import { BrandDirectory } from '@/components/marketplace/BrandDirectory'
import { DistributionNetworkSection } from '@/components/factory/DistributionNetworkSection'

export const metadata = { title: 'Factories · TTAI EMA' }

export default function FactoriesPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string; industry?: string }
}) {
  return (
    <>
      <DistributionNetworkSection />
      <BrandDirectory kind="factory" searchParams={searchParams} />
    </>
  )
}
