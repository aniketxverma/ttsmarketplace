'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PROVIDERS = [
  { v: 'openai', label: 'OpenAI (GPT)' },
  { v: 'anthropic', label: 'Anthropic (Claude)' },
  { v: 'deepl', label: 'DeepL' },
]

type Stat = { lang: string; name: string; translated: number; total: number; cached: number }

export function TranslationManager({
  initial, stats, targetLangs, localeNames, totalProducts,
}: {
  initial: { enabled: boolean; provider: string; hasOpenai: boolean; hasAnthropic: boolean; hasDeepl: boolean }
  stats: Stat[]
  targetLangs: string[]
  localeNames: Record<string, string>
  totalProducts: number
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
  const [sel, setSel] = useState<Set<string>>(new Set(targetLangs)) // languages to translate into

  const toggleLang = (l: string) => setSel((p) => { const n = new Set(p); n.has(l) ? n.delete(l) : n.add(l); return n })
  const allSelected = sel.size === targetLangs.length

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
    const langs = Array.from(sel)
    if (!langs.length) { alert('Pick at least one language.'); return }
    const names = langs.map((l) => localeNames[l] ?? l).join(', ')
    if (!confirm(`Translate all published products into: ${names}?\nAlready-translated text is skipped.`)) return
    setRunning(true); setResult(null)

    let offset = 0, total = 0, texts = 0, languages = 0, guard = 0
    try {
      while (guard++ < 1000) {
        const res = await fetch('/api/admin/translation', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'backfill', offset, batch: 3, langs }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) { setResult(json.error ?? `Failed (HTTP ${res.status})`); setRunning(false); return }
        total = json.total ?? total
        languages = json.languages ?? languages
        texts += json.texts ?? 0
        offset = json.nextOffset ?? offset
        setResult(`Translating… ${Math.min(offset, total)} / ${total} products`)
        if (json.done) break
      }
      setResult(`Done — ${total} products × ${languages} languages (${texts} texts processed).`)
    } catch (e: any) {
      setResult(e?.message ? `Failed: ${e.message}` : 'Failed (network)')
    }
    setRunning(false)
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
      {/* ── Translation progress per language ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="font-bold text-[#0B1F4D]">Translation progress</p>
          <p className="text-xs text-gray-400">{totalProducts} products per language</p>
        </div>
        <div className="space-y-2.5">
          {stats.map((st) => {
            const pct = st.total ? Math.round((st.translated / st.total) * 100) : 0
            const left = Math.max(st.total - st.translated, 0)
            return (
              <div key={st.lang} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-semibold text-gray-700">{st.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-[#F5A623]' : 'bg-gray-300'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right text-xs font-bold text-[#0B1F4D]">{pct}%</span>
                <span className="w-32 shrink-0 text-right text-[11px] text-gray-400">{st.translated}/{st.total} · {left} left</span>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-gray-400">Based on product names found in the translation cache. New products translate automatically on first view.</p>
      </div>

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
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
        <p className="font-bold text-[#0B1F4D]">Translate existing products</p>
        <p className="text-xs text-gray-400">Choose which languages to translate into. Already-translated text is skipped, so you can safely re-run to fill the gaps.</p>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Languages</label>
            <button type="button" onClick={() => setSel(allSelected ? new Set() : new Set(targetLangs))}
              className="text-xs font-bold text-[#0B1F4D] hover:underline">{allSelected ? 'Clear all' : 'Select all'}</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {targetLangs.map((l) => {
              const on = sel.has(l)
              return (
                <button key={l} type="button" onClick={() => toggleLang(l)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${on ? 'border-[#0B1F4D] bg-[#0B1F4D] text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {localeNames[l] ?? l}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={backfill} disabled={running}
            className="rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] disabled:opacity-60">
            {running ? 'Translating…' : `Translate into ${sel.size === targetLangs.length ? 'all languages' : `${sel.size} language${sel.size === 1 ? '' : 's'}`}`}
          </button>
          {result && <span className="text-sm text-gray-600">{result}</span>}
        </div>
      </div>
    </div>
  )
}
