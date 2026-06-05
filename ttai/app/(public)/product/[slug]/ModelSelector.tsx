'use client'

import { useRouter } from 'next/navigation'

/**
 * Switch between the models (sibling products in the same product line) from
 * one product page. Selecting a model navigates to that product, preserving the
 * shop context.
 */
export function ModelSelector({
  models, currentId, shop,
}: {
  models: { id: string; slug: string; name: string; model_name: string | null }[]
  currentId: string
  shop?: string
}) {
  const router = useRouter()
  const suffix = shop ? `?shop=${shop}` : ''

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Select model</label>
      <select
        value={currentId}
        onChange={(e) => {
          const m = models.find((x) => x.id === e.target.value)
          if (m) router.push(`/product/${m.slug}${suffix}`)
        }}
        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-semibold text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] cursor-pointer"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>{m.model_name ?? m.name}</option>
        ))}
      </select>
    </div>
  )
}
