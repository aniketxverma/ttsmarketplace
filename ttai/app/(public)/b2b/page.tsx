import { redirect } from 'next/navigation'

// The Trade Hub now shares the exact same organized experience as the main
// Marketplace (category banner sections + sub-category drill-down). Rather than
// maintain a second, divergent catalogue, /b2b forwards to /marketplace so every
// entry point — header, homepage "Shop Trade", footer — lands on one consistent
// page. Any query params (category, search) are preserved.
export default function B2BPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string; supplier?: string }
}) {
  const qs = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => v != null) as [string, string][],
  ).toString()
  redirect(`/marketplace${qs ? `?${qs}` : ''}`)
}
