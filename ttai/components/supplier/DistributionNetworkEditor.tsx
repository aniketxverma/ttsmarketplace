'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Plus, Trash2, Save, CheckCircle2, Globe } from 'lucide-react'
import { NET_STATUS, type DistNetwork, type NetNode, type NetStatus } from '@/lib/distribution-network'
import { DistributionNetwork } from '@/components/brand/DistributionNetwork'
import { ImageUpload } from '@/components/ImageUpload'

const STATUS_OPTIONS = Object.entries(NET_STATUS) as [NetStatus, { label: string; color: string; opportunity: boolean }][]
const flag = (iso: string) => (iso && iso.length === 2 ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🏳️')

const blankNode = (): NetNode => ({ iso: '', country: '', status: 'official', company: '', profile: '', verified: false, benefits: [] })

export function DistributionNetworkEditor({ initial }: { initial: DistNetwork | null }) {
  const t = useT()
  const [center, setCenter] = useState(initial?.center ?? { title: 'Head Office / Factory', subtitle: '', iso: '', since: '', image: '' })
  const [nodes, setNodes] = useState<NetNode[]>(initial?.nodes ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const net: DistNetwork = { center: { ...center, image: center.image || null }, nodes }

  const setNode = (i: number, patch: Partial<NetNode>) => setNodes((ns) => ns.map((n, j) => (j === i ? { ...n, ...patch } : n)))

  async function save() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/supplier/distribution-network', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(net),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'failed')
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e: any) { setError(e.message === 'failed' ? 'Could not save. Please try again.' : e.message) }
    finally { setSaving(false) }
  }

  const input = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F4D] flex items-center gap-2"><Globe className="w-6 h-6" /> {t("Global Distribution Network")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Add your branches and the partners you’re looking for. This shows as a “Network” tab on your profile and when buyers open your card.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5 text-sm font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60 flex-shrink-0">
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Centre / head office */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h2 className="font-bold text-sm text-gray-800">{t("Head Office / Factory (centre)")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-bold text-gray-600">{t("Title")}</span>
            <input className={input} value={center.title} onChange={(e) => setCenter({ ...center, title: e.target.value })} placeholder={t("Head Office / Factory")} /></label>
          <label className="block"><span className="text-xs font-bold text-gray-600">{t("Location")}</span>
            <input className={input} value={center.subtitle ?? ''} onChange={(e) => setCenter({ ...center, subtitle: e.target.value })} placeholder={t("Chtaura, Lebanon")} /></label>
          <label className="block"><span className="text-xs font-bold text-gray-600">{t("Country code (ISO-2)")} {flag(center.iso)}</span>
            <input className={input} maxLength={2} value={center.iso} onChange={(e) => setCenter({ ...center, iso: e.target.value.toUpperCase() })} placeholder="LB" /></label>
          <label className="block"><span className="text-xs font-bold text-gray-600">{t("Since (optional)")}</span>
            <input className={input} value={center.since ?? ''} onChange={(e) => setCenter({ ...center, since: e.target.value })} placeholder={t("Since 1936")} /></label>
          <div className="block sm:col-span-2"><span className="text-xs font-bold text-gray-600">{t("Warehouse / factory photo (shown in the centre)")}</span>
            <div className="mt-1"><ImageUpload value={center.image || null} onChange={(url) => setCenter({ ...center, image: url })} folder="banners" aspect="wide" label={t("Warehouse / factory photo")} /></div>
          </div>
        </div>
      </div>

      {/* Countries */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-800">{t("Countries (")}{nodes.length})</h2>
          <button onClick={() => setNodes((ns) => [...ns, blankNode()])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B1F4D] text-[#0B1F4D] px-3 py-1.5 text-xs font-bold hover:bg-[#0B1F4D]/5">
            <Plus className="w-3.5 h-3.5" /> {t("Add country")}
          </button>
        </div>

        {nodes.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">{t("No countries yet — add your first branch or partner opportunity.")}</p>}

        <div className="space-y-3">
          {nodes.map((n, i) => {
            const cfg = NET_STATUS[n.status]
            return (
              <div key={i} className="rounded-xl border border-gray-200 p-3.5" style={{ borderLeft: `4px solid ${cfg.color}` }}>
                <div className="grid sm:grid-cols-[1fr_90px_1fr] gap-2.5">
                  <label className="block"><span className="text-[11px] font-bold text-gray-500">{t("Country")} {flag(n.iso)}</span>
                    <input className={input} value={n.country} onChange={(e) => setNode(i, { country: e.target.value })} placeholder={t("Germany")} /></label>
                  <label className="block"><span className="text-[11px] font-bold text-gray-500">ISO-2</span>
                    <input className={input} maxLength={2} value={n.iso} onChange={(e) => setNode(i, { iso: e.target.value.toUpperCase() })} placeholder="DE" /></label>
                  <label className="block"><span className="text-[11px] font-bold text-gray-500">{t("Status")}</span>
                    <select className={input} value={n.status} onChange={(e) => setNode(i, { status: e.target.value as NetStatus })}>
                      {STATUS_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select></label>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5 mt-2.5">
                  <label className="block"><span className="text-[11px] font-bold text-gray-500">{t("Partner company (if official)")}</span>
                    <input className={input} value={n.company ?? ''} onChange={(e) => setNode(i, { company: e.target.value })} placeholder={t("CHOMAKHER Import GmbH")} /></label>
                  <label className="flex items-center gap-2 mt-5">
                    <input type="checkbox" checked={!!n.verified} onChange={(e) => setNode(i, { verified: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-600">{t("Verified partner")}</span>
                  </label>
                </div>
                {!cfg.opportunity && (
                  <label className="block mt-2.5"><span className="text-[11px] font-bold text-gray-500">{t("Distributor's TTAIZ profile — slug or link (makes the company name clickable)")}</span>
                    <input className={input} value={n.profile ?? ''} onChange={(e) => setNode(i, { profile: e.target.value })} placeholder="chomakher  ·  https://ttaiz.com/brand/chomakher" /></label>
                )}
                {cfg.opportunity && (
                  <label className="block mt-2.5"><span className="text-[11px] font-bold text-gray-500">{t("Benefits (one per line — shown on the Apply card)")}</span>
                    <textarea className={input} rows={3} value={(n.benefits ?? []).join('\n')}
                      onChange={(e) => setNode(i, { benefits: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                      placeholder={'Exclusive territory\nDirect factory pricing\nMarketing support'} /></label>
                )}
                <button onClick={() => setNodes((ns) => ns.filter((_, j) => j !== i))}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
                  <Trash2 className="w-3.5 h-3.5" /> {t("Remove")}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live preview */}
      {nodes.length > 0 && (
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-3">{t("Live preview")}</p>
          <DistributionNetwork net={net} />
        </div>
      )}
    </div>
  )
}
