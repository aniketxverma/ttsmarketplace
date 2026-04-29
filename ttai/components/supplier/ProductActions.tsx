'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  productId: string
  isPublished: boolean
}

export function ProductActions({ productId, isPublished }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleTogglePublish() {
    setLoading(true)
    await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !isPublished }),
    })
    router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    await fetch(`/api/products/${productId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
    setConfirmDelete(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTogglePublish}
        disabled={loading}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          isPublished
            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {isPublished ? 'Unpublish' : 'Publish'}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        onBlur={() => setConfirmDelete(false)}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          confirmDelete
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
        }`}
      >
        {confirmDelete ? 'Confirm delete' : 'Delete'}
      </button>
    </div>
  )
}
