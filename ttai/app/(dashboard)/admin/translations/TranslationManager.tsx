'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PROVIDERS = [
  { v: 'openai', label: 'OpenAI (GPT)' },
  { v: 'anthropic', label: 'Anthropic (Claude)' },
  { v: 'deepl', label: 'DeepL' },
]

export function TranslationManager({
  initial,
}: {
  initial: { enabled: boolean; provider: string; hasOpenai: boolean; hasAnthropic: boolean; hasDeepl: boolean }
}) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initial.enabled)
  const [provider, setProvider] = useState(initial.provider)
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [deeplKey, setDeeplKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function save() {
    setSaving(true); setSaved(false)
    const res = await fetch('/api/admin/translation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', enabled, provider, openaiKey, anthropicKey, deeplKey }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setOpenaiKey(''); setAnthropicKey(''); setDeeplKey(''); router.refresh(); setTimeout(() => setSaved(false), 2500) }
    else alert((await res.json().catch(() => ({})))?.error ?? 'Save failed')
  }

  async function backfill() {
    if (!confirm('Translate all published products into every language now? This may take a while.')) return
    setRunning(true); setResult(null)
    const res = await fetch('/api/admin/translation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'backfill' }),
    })
    const json = await res.json().catch(() => ({}))
    setRunning(false)
    setResult(res.ok ? `Done — ${json.products} products × ${json.languages} languages (${json.texts} texts processed).` : (json.error ?? 'Failed'))
    router.refresh()
  }

  const KeyField = ({ label, has, value, onChange }: { label: string; has: boolean; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label} {has && <span className="text-green-600 normal-case">· set ✓</span>}</label>
      <input type="password" value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off"
        placeholder={has ? 'Enter a new key to replace' : 'Paste API key'}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Settings */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[#0B1F4D]">AI translation</p>
            <p className="text-xs text-gray-400">Auto-translate product content into every language.</p>
          </div>
          <button type="button" onClick={() => setEnabled((e) => !e)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]">
            {PROVIDERS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
          </select>
        </div>

        <KeyField label="OpenAI API key"    has={initial.hasOpenai}    value={openaiKey}    onChange={setOpenaiKey} />
        <KeyField label="Anthropic API key" has={initial.hasAnthropic} value={anthropicKey} onChange={setAnthropicKey} />
        <KeyField label="DeepL API key"     has={initial.hasDeepl}     value={deeplKey}     onChange={setDeeplKey} />

        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={saving}
            className="rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-60">
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-sm font-bold text-green-600">Saved ✓</span>}
        </div>
        <p className="text-xs text-gray-400">Keys are stored securely server-side and never sent to the browser. Leave a field blank to keep the existing key.</p>
      </div>

      {/* Backfill */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-3">
        <p className="font-bold text-[#0B1F4D]">Translate existing products</p>
        <p className="text-xs text-gray-400">New products are translated automatically when first viewed. Run this to translate all current products into every language now (already-translated text is skipped).</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={backfill} disabled={running}
            className="rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] disabled:opacity-60">
            {running ? 'Translating…' : 'Translate all products'}
          </button>
          {result && <span className="text-sm text-gray-600">{result}</span>}
        </div>
      </div>
    </div>
  )
}
