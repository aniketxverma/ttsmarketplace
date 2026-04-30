'use client'

import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DeleteCategory({ categoryId, hasChildren }: { categoryId: string; hasChildren: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (hasChildren) {
    return <span className="text-xs text-muted-foreground">has children</span>
  }

  function handleDelete() {
    if (!confirm('Delete this category? Products using it will lose their category assignment.')) return
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('categories').delete().eq('id', categoryId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-60"
    >
      Delete
    </button>
  )
}
