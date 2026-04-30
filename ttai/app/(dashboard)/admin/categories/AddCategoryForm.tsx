'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  rootCategories: { id: string; name: string }[]
}

export function AddCategoryForm({ rootCategories }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [parentId, setParentId] = useState('')
  const [context, setContext] = useState<'both' | 'wholesale' | 'retail'>('both')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toSlug(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleNameChange(v: string) {
    setName(v)
    setSlug(toSlug(v))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required'); return }
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.from('categories').insert({
        name: name.trim(),
        slug: slug.trim(),
        parent_id: parentId || null,
        marketplace_context: context,
        depth: parentId ? 1 : 0,
        sort_order: 99,
      })
      if (err) { setError(err.message); return }
      setName(''); setSlug(''); setParentId(''); setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5 text-sm font-bold hover:bg-[#fbb93a] transition-colors w-fit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 space-y-4">
      <h3 className="font-semibold">New Category</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Fresh Produce"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slug *</label>
          <input
            value={slug}
            onChange={(e) => setSlug(toSlug(e.target.value))}
            placeholder="fresh-produce"
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parent (optional)</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]"
          >
            <option value="">— Root category —</option>
            {rootCategories.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Context</label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as any)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]"
          >
            <option value="both">Both</option>
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#0B1F4D] text-white px-6 py-2 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Category'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:underline">
          Cancel
        </button>
      </div>
    </form>
  )
}
