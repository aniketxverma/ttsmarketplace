'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

// Inline priority editor — higher number surfaces the category first everywhere.
export function CategoryPriority({ id, initial }: { id: string; initial: number }) {
  const [v, setV] = useState(String(initial ?? 0))
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const save = async () => {
    setState('saving')
    try {
      const r = await fetch('/api/admin/category-priority', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, priority: Number(v) || 0 }) })
      setState(r.ok ? 'saved' : 'idle')
      if (r.ok) setTimeout(() => setState('idle'), 1500)
    } catch { setState('idle') }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input type="number" min={0} value={v} onChange={(e) => setV(e.target.value)} onBlur={save}
        title="Higher = appears first" className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      {state === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      {state === 'saved' && <Check className="w-3.5 h-3.5 text-green-500" />}
    </span>
  )
}
