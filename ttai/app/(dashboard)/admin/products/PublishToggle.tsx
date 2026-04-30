'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function PublishToggle({ productId, isPublished }: { productId: string; isPublished: boolean }) {
  const [published, setPublished] = useState(isPublished)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('products').update({ is_published: !published }).eq('id', productId)
      setPublished((p) => !p)
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-60 ${
        published ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          published ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
