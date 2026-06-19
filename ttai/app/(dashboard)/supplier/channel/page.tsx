'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Radio, Users, FileText, Send, Settings, Copy, Check,
  Megaphone, Tag, Package, Bell, ExternalLink, Trash2,
  Eye, EyeOff, ChevronRight, Loader, Plus, ImagePlus, X, MessagesSquare,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Channel = {
  id: string; name: string; description: string | null; whatsapp: string | null
  whatsapp_channel_url?: string | null
  invite_code: string; is_active: boolean; member_count: number; post_count: number
  created_at: string
}
type Post = {
  id: string; content: string; image_url: string | null; video_url?: string | null; post_type: string; created_at: string
}
type Group = {
  id: string; name: string; description: string | null; category: string | null
  invite_link: string; member_count: number
}

// ── Post type config ──────────────────────────────────────────────────────────
const POST_TYPES = {
  update:       { label: 'Update',       Icon: Bell,      badge: 'bg-blue-100 text-blue-700',    bg: 'bg-blue-50',    text: 'text-blue-600'   },
  offer:        { label: 'Offer',        Icon: Tag,       badge: 'bg-amber-100 text-amber-700',  bg: 'bg-amber-50',   text: 'text-amber-600'  },
  product:      { label: 'Product',      Icon: Package,   badge: 'bg-purple-100 text-purple-700',bg: 'bg-purple-50',  text: 'text-purple-600' },
  announcement: { label: 'Announcement', Icon: Megaphone, badge: 'bg-green-100 text-green-700',  bg: 'bg-green-50',   text: 'text-green-600'  },
} as const

type PostType = keyof typeof POST_TYPES

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SupplierChannelPage() {
  const [channel, setChannel]   = useState<Channel | null>(null)
  const [posts,   setPosts]     = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [posting,  setPosting]  = useState(false)
  const [settings, setSettings] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [error,    setError]    = useState('')

  // Image upload state
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  // Forms
  const [cForm, setCForm] = useState({ name: '', description: '', whatsapp: '', whatsapp_channel_url: '' })
  const [pForm, setPForm] = useState({ content: '', post_type: 'update' as PostType })
  const [sForm, setSForm] = useState({ name: '', description: '', whatsapp: '', whatsapp_channel_url: '' })

  // WhatsApp groups
  const [groups, setGroups]   = useState<Group[]>([])
  const [gForm,  setGForm]    = useState({ name: '', category: '', region: '', invite_link: '', description: '' })
  const [gBusy,  setGBusy]    = useState(false)
  const [gError, setGError]   = useState('')

  // ── Fetch channel ────────────────────────────────────────────────────────
  const loadChannel = useCallback(async () => {
    const res = await fetch('/api/channels')
    if (!res.ok) { setLoading(false); return }
    const { channel } = await res.json()
    if (channel) {
      setChannel(channel)
      setSForm({ name: channel.name, description: channel.description ?? '', whatsapp: channel.whatsapp ?? '', whatsapp_channel_url: channel.whatsapp_channel_url ?? '' })
      loadPosts(channel.id)
    }
    setLoading(false)
  }, [])

  const loadPosts = async (channelId: string) => {
    const res = await fetch(`/api/channels/${channelId}/posts?limit=20`)
    const { posts } = await res.json()
    setPosts(posts ?? [])
  }

  const loadGroups = useCallback(async () => {
    const res = await fetch('/api/groups')
    if (!res.ok) return
    const { groups } = await res.json()
    setGroups(groups ?? [])
  }, [])

  useEffect(() => { loadChannel(); loadGroups() }, [loadChannel, loadGroups])

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gForm.name.trim() || !gForm.invite_link.trim()) return
    setGBusy(true); setGError('')
    const res = await fetch('/api/groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gForm),
    })
    const data = await res.json()
    setGBusy(false)
    if (!res.ok) { setGError(data.error ?? 'Could not add group'); return }
    setGroups(prev => [data.group, ...prev])
    setGForm({ name: '', category: '', region: '', invite_link: '', description: '' })
  }

  const handleDeleteGroup = async (id: string) => {
    await fetch(`/api/groups/${id}`, { method: 'DELETE' })
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  // ── Image handlers ───────────────────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return }
    setError('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (imgRef.current) imgRef.current.value = ''
  }

  // ── Create channel ───────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cForm.name.trim()) return
    setCreating(true); setError('')
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cForm),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setCreating(false); return }
    setChannel(data.channel)
    setSForm({ name: data.channel.name, description: data.channel.description ?? '', whatsapp: data.channel.whatsapp ?? '', whatsapp_channel_url: data.channel.whatsapp_channel_url ?? '' })
    setCreating(false)
  }

  // ── Create post ──────────────────────────────────────────────────────────
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channel || !pForm.content.trim()) return
    setPosting(true); setError('')

    let imageUrl: string | null = null

    // Upload image first if one was selected
    if (imageFile) {
      setUploadingImg(true)
      const fd = new FormData()
      fd.append('file', imageFile)
      const uploadRes = await fetch('/api/channels/upload-image', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      setUploadingImg(false)
      if (!uploadRes.ok) { setError(uploadData.error ?? 'Image upload failed'); setPosting(false); return }
      imageUrl = uploadData.url
    }

    const res = await fetch(`/api/channels/${channel.id}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: pForm.content, post_type: pForm.post_type, image_url: imageUrl }),
    })
    const data = await res.json()
    if (res.ok) {
      setPosts(prev => [data.post, ...prev])
      setPForm({ content: '', post_type: 'update' })
      clearImage()
      setChannel(prev => prev ? { ...prev, post_count: prev.post_count + 1 } : prev)
    } else {
      setError(data.error ?? 'Failed to post')
    }
    setPosting(false)
  }

  // ── Save settings ────────────────────────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channel) return
    const res = await fetch(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sForm),
    })
    const data = await res.json()
    if (res.ok) { setChannel(data.channel); setSettings(false) }
  }

  // ── Toggle active ────────────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!channel) return
    const res = await fetch(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !channel.is_active }),
    })
    const data = await res.json()
    if (res.ok) setChannel(data.channel)
  }

  // ── Delete post ──────────────────────────────────────────────────────────
  const handleDeletePost = async (postId: string) => {
    if (!channel) return
    await fetch(`/api/channels/${channel.id}/posts/${postId}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== postId))
    setChannel(prev => prev ? { ...prev, post_count: Math.max(prev.post_count - 1, 0) } : prev)
  }

  // ── Copy link ────────────────────────────────────────────────────────────
  const copyLink = async () => {
    if (!channel) return
    await navigator.clipboard.writeText(`${window.location.origin}/channel/${channel.id}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#0B1F4D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════
  // CREATE FORM
  // ════════════════════════════════════════════════════════════════════════
  if (!channel) return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#0B1F4D] to-[#1D4ED8]" />
        <div className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0B1F4D] flex items-center justify-center mb-5 shadow-md">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D] mb-1">Create Your Canal</h1>
          <p className="text-sm text-gray-400 mb-7 leading-relaxed">
            Broadcast product updates, exclusive offers and announcements directly to buyers who follow your brand.
          </p>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-5 border border-red-100">{error}</div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Canal Name *</label>
              <input type="text" value={cForm.name} onChange={e => setCForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rozil Official Canal"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={cForm.description} onChange={e => setCForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What will you share in this canal?"
                rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                WhatsApp Number <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input type="tel" value={cForm.whatsapp} onChange={e => setCForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
              <p className="text-[11px] text-gray-400 mt-1">For buyers to contact you directly.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                WhatsApp Channel link <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input type="url" value={cForm.whatsapp_channel_url} onChange={e => setCForm(f => ({ ...f, whatsapp_channel_url: e.target.value }))}
                placeholder="https://whatsapp.com/channel/…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
              <p className="text-[11px] text-gray-400 mt-1">Your official WhatsApp Channel — buyers can follow it for offers &amp; stock updates.</p>
            </div>
            <button type="submit" disabled={creating || !cForm.name.trim()}
              className="w-full py-3.5 bg-[#0B1F4D] hover:bg-[#162d6e] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
              {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Launch Canal'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { icon: Radio, title: 'Broadcast', desc: 'Post updates to all members at once' },
          { icon: Users, title: 'Grow',      desc: 'Buyers follow from your brand page' },
          { icon: Tag,   title: 'Sell More', desc: 'Share exclusive offers & new products' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl bg-[#0B1F4D]/8 flex items-center justify-center mx-auto mb-2">
              <Icon className="w-4 h-4 text-[#0B1F4D]" />
            </div>
            <p className="text-xs font-extrabold text-gray-800 mb-0.5">{title}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════
  // MANAGEMENT DASHBOARD
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Channel header ───────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #1a3a7a 60%, #0d3060 100%)' }}>
        <div className="px-7 py-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <Radio className="w-5 h-5 text-[#F5A623] flex-shrink-0" />
                <h1 className="text-xl font-extrabold text-white truncate">{channel.name}</h1>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  channel.is_active ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'
                }`}>
                  {channel.is_active ? '● Live' : '● Paused'}
                </span>
              </div>
              {channel.description && (
                <p className="text-white/55 text-sm leading-relaxed">{channel.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={copyLink}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Share Link'}
              </button>
              <Link href={`/channel/${channel.id}`} target="_blank"
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />Preview
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-extrabold text-white">{channel.member_count.toLocaleString()}</p>
              <p className="text-xs text-white/45 mt-0.5 flex items-center gap-1"><Users className="w-3 h-3" />Subscribers</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-2xl font-extrabold text-white">{channel.post_count.toLocaleString()}</p>
              <p className="text-xs text-white/45 mt-0.5 flex items-center gap-1"><FileText className="w-3 h-3" />Posts</p>
            </div>
            {channel.whatsapp && (
              <>
                <div className="w-px h-10 bg-white/15" />
                <div>
                  <p className="text-xs text-white/45 mb-0.5">WhatsApp</p>
                  <p className="text-sm font-bold text-white">{channel.whatsapp}</p>
                </div>
              </>
            )}
            {channel.whatsapp_channel_url && (
              <>
                <div className="w-px h-10 bg-white/15" />
                <a href={channel.whatsapp_channel_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ea952] text-white text-xs font-bold px-3.5 py-2 transition-colors">
                  <MessagesSquare className="w-3.5 h-3.5" /> WhatsApp Channel
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Post Composer ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#0B1F4D]" />
          <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide">New Post</h2>
        </div>

        <form onSubmit={handlePost} className="p-6 space-y-4">
          {/* Type chips */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(POST_TYPES) as [PostType, typeof POST_TYPES[PostType]][]).map(([value, cfg]) => (
              <button key={value} type="button"
                onClick={() => setPForm(f => ({ ...f, post_type: value }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border-2 transition-all ${
                  pForm.post_type === value
                    ? `${cfg.badge} border-current shadow-sm scale-105`
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                }`}>
                <cfg.Icon className="w-3.5 h-3.5" />{cfg.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={pForm.content}
            onChange={e => setPForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your update, offer, or announcement for your subscribers…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] resize-none"
            required
          />

          {/* Image section */}
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-64" />
              <button type="button" onClick={clearImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => imgRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#0B1F4D]/40 hover:text-[#0B1F4D] transition-colors text-sm font-semibold">
              <ImagePlus className="w-4 h-4" />
              Attach Image
            </button>
          )}
          <input ref={imgRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">{error}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              {channel.member_count > 0
                ? `Broadcast to ${channel.member_count} subscriber${channel.member_count !== 1 ? 's' : ''}`
                : 'Visible to all subscribers once they join'}
            </p>
            <button type="submit" disabled={posting || !pForm.content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B1F4D] hover:bg-[#162d6e] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
              {posting
                ? <><Loader className="w-4 h-4 animate-spin" />{uploadingImg ? 'Uploading…' : 'Posting…'}</>
                : <><Send className="w-4 h-4" />Post to Canal</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── Posts feed ───────────────────────────────────────────────── */}
      {posts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0B1F4D]" />
            <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide">Recent Posts</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {posts.map(post => {
              const cfg = POST_TYPES[post.post_type as PostType] ?? POST_TYPES.update
              return (
                <div key={post.id} className="flex gap-3 p-5 hover:bg-gray-50/60 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.Icon className={`w-4 h-4 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[11px] text-gray-400">{fmtDate(post.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                    {post.video_url ? (
                      <video src={post.video_url} controls className="mt-2.5 rounded-xl max-h-48 bg-black border border-gray-100" />
                    ) : post.image_url && (
                      <img src={post.image_url} alt="" className="mt-2.5 rounded-xl max-h-48 object-cover border border-gray-100" />
                    )}
                  </div>
                  <button onClick={() => handleDeletePost(post.id)} title="Delete"
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">No posts yet — compose your first update above.</p>
        </div>
      )}

      {/* ── Canal Settings ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setSettings(!settings)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
          <span className="flex items-center gap-2 font-extrabold text-[#0B1F4D] text-sm">
            <Settings className="w-4 h-4" />Canal Settings
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${settings ? 'rotate-90' : ''}`} />
        </button>
        {settings && (
          <form onSubmit={handleSaveSettings} className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Canal Name *</label>
              <input type="text" value={sForm.name} onChange={e => setSForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={sForm.description} onChange={e => setSForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">WhatsApp Number</label>
              <input type="tel" value={sForm.whatsapp} onChange={e => setSForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">WhatsApp Channel link</label>
              <input type="url" value={sForm.whatsapp_channel_url} onChange={e => setSForm(f => ({ ...f, whatsapp_channel_url: e.target.value }))}
                placeholder="https://whatsapp.com/channel/…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
              <p className="text-[11px] text-gray-400 mt-1">Public link buyers can follow for offers, stock updates &amp; announcements.</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" className="px-5 py-2.5 bg-[#0B1F4D] text-white rounded-xl text-sm font-bold hover:bg-[#162d6e] transition-colors">
                Save Changes
              </button>
              <button type="button" onClick={() => setSettings(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── WhatsApp Groups ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <MessagesSquare className="w-4 h-4 text-[#1ea952]" />
          <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide">WhatsApp Groups</h2>
        </div>

        <form onSubmit={handleAddGroup} className="p-6 space-y-3 border-b border-gray-50">
          <p className="text-xs text-gray-400">List your public WhatsApp group so buyers can find and join it in the marketplace directory.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <input value={gForm.name} onChange={e => setGForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Group name *" className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" required />
            <input value={gForm.category} onChange={e => setGForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Category (e.g. Electronics)" className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
            <select value={gForm.region} onChange={e => setGForm(f => ({ ...f, region: e.target.value }))}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]">
              <option value="">Region…</option>
              {['Spain', 'Europe', 'Africa', 'Middle East', 'Latin America', 'Asia', 'North America', 'Global'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <input value={gForm.invite_link} onChange={e => setGForm(f => ({ ...f, invite_link: e.target.value }))}
            placeholder="WhatsApp invite link * — https://chat.whatsapp.com/…"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" required />
          <input value={gForm.description} onChange={e => setGForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Short description (optional)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
          {gError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">{gError}</p>}
          <button type="submit" disabled={gBusy || !gForm.name.trim() || !gForm.invite_link.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1ea952] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            {gBusy ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add group
          </button>
        </form>

        {groups.length > 0 && (
          <div className="divide-y divide-gray-50">
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-4 hover:bg-gray-50/60 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                  <MessagesSquare className="w-4 h-4 text-[#1ea952]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{g.name} {g.category && <span className="text-xs text-gray-400 font-normal">· {g.category}</span>}</p>
                  <a href={g.invite_link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1ea952] hover:underline truncate block">{g.invite_link}</a>
                </div>
                <button onClick={() => handleDeleteGroup(g.id)} title="Delete"
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Danger zone ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-red-600 mb-4 uppercase tracking-wide">Danger Zone</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-800">
              {channel.is_active ? 'Pause Canal' : 'Resume Canal'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {channel.is_active
                ? 'Temporarily hide your canal from buyers. Posts are preserved.'
                : 'Make your canal visible and joinable again.'}
            </p>
          </div>
          <button onClick={handleToggle}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              channel.is_active
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-green-200 text-green-700 hover:bg-green-50'
            }`}>
            {channel.is_active ? <><EyeOff className="w-4 h-4" />Pause</> : <><Eye className="w-4 h-4" />Resume</>}
          </button>
        </div>
      </div>

    </div>
  )
}
