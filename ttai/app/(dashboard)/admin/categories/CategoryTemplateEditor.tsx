'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Field = { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }

function slugKey(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
}

export function CategoryTemplateEditor({
  categoryId,
  categoryName,
  initialFields,
}: {
  categoryId: string
  categoryName: string
  initialFields: Field[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const count = initialFields.length

  function update(i: number, patch: Partial<Field>) {
    setFields((f) => f.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  function addField() {
    setFields((f) => [...f, { key: '', label: '', type: 'text' }])
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    setError(null)
    // Auto-derive any missing keys from labels before sending.
    const payload = fields
      .map((f) => ({ ...f, key: (f.key || slugKey(f.label)).trim().toLowerCase() }))
      .filter((f) => f.label.trim() && f.key)
    const res = await fetch('/api/admin/category-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, fields: payload }),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Save failed'); return }
    setFields(json.fields ?? payload)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => { setFields(initialFields); setOpen(true) }}
        className="text-xs font-semibold text-[#0B1F4D] hover:underline"
      >
        🧬 Fields{count ? ` (${count})` : ''}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-extrabold text-[#0B1F4D]">Specification fields</h2>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">
              Fields suppliers fill in for products in <span className="font-semibold">{categoryName}</span>.
            </p>

            <div className="space-y-3">
              {fields.length === 0 && (
                <p className="text-xs text-gray-400 italic">No fields yet — add the first one below.</p>
              )}
              {fields.map((f, i) => (
                <div key={i} className="rounded-xl border border-gray-150 bg-gray-50/60 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={f.label}
                      onChange={(e) => update(i, { label: e.target.value, key: f.key || slugKey(e.target.value) })}
                      placeholder="Label (e.g. Storage)"
                      className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => update(i, { type: e.target.value as Field['type'] })}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                    </select>
                    <button onClick={() => removeField(i)} className="text-red-500 hover:text-red-700 px-1.5 text-lg leading-none">×</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 w-9">key</span>
                    <input
                      value={f.key}
                      onChange={(e) => update(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      placeholder="auto"
                      className="font-mono text-xs rounded-lg border border-gray-200 px-2 py-1 w-40 bg-white"
                    />
                  </div>
                  {f.type === 'select' && (
                    <input
                      value={(f.options ?? []).join(', ')}
                      onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      placeholder="Options, comma separated (e.g. Men, Women, Unisex)"
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-white"
                    />
                  )}
                </div>
              ))}
            </div>

            <button onClick={addField} className="mt-3 text-sm font-semibold text-[#0B1F4D] hover:underline">+ Add field</button>

            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-[#0B1F4D] text-white rounded-lg hover:bg-[#162d6e] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save fields'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
