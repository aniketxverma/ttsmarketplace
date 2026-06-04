'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/components/ImageUpload'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Supplier {
  id: string
  trade_name: string | null
  brand_slug: string | null
  tagline: string | null
  logo_url: string | null
  banner_image: string | null
  description: string | null
  about_company: string | null
  founded_year: number | null
  employee_count: number | null
  years_experience: number | null
  countries_served: number | null
  website: string | null
  phone: string | null
  whatsapp: string | null
  business_email: string | null
  working_hours: string | null
  google_map_link: string | null
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  twitter: string | null
  youtube: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  og_image: string | null
  badges: string[] | null
  section_visibility: Record<string, boolean> | null
}

interface GalleryItem {
  id: string
  url: string
  type: 'image' | 'video'
  caption: string | null
  sort_order: number
}

interface Certification {
  id: string
  title: string
  issuer: string | null
  issued_date: string | null
  expiry_date: string | null
  image_url: string | null
}

interface Props {
  supplier: Supplier
  gallery: GalleryItem[]
  certifications: Certification[]
}

const TABS = [
  { id: 'basic',    label: 'Basic Info' },
  { id: 'about',    label: 'About' },
  { id: 'gallery',  label: 'Gallery & Media' },
  { id: 'certs',    label: 'Certifications' },
  { id: 'contact',  label: 'Contact' },
  { id: 'social',   label: 'Social Links' },
  { id: 'seo',      label: 'SEO' },
  { id: 'settings', label: 'Settings' },
]

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function SaveBar({ saved, saving, error, onSave }: { saved: boolean; saving: boolean; error: string | null; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 mb-6">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {saving && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && (
        <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Saved!
        </span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  )
}

const INPUT = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 focus:border-[#0B1F4D] bg-white transition-all'
const TEXTAREA = `${INPUT} resize-y min-h-[100px]`

export function BrandProfileEditor({ supplier, gallery: initialGallery, certifications: initialCerts }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState('basic')

  // Form state
  const [form, setForm] = useState({
    brand_slug:      supplier.brand_slug ?? '',
    tagline:         supplier.tagline ?? '',
    logo_url:        supplier.logo_url ?? '',
    banner_image:    supplier.banner_image ?? '',
    description:     supplier.description ?? '',
    about_company:   supplier.about_company ?? '',
    founded_year:    supplier.founded_year?.toString() ?? '',
    employee_count:  supplier.employee_count?.toString() ?? '',
    years_experience: supplier.years_experience?.toString() ?? '',
    countries_served: supplier.countries_served?.toString() ?? '',
    website:         supplier.website ?? '',
    phone:           supplier.phone ?? '',
    whatsapp:        supplier.whatsapp ?? '',
    business_email:  supplier.business_email ?? '',
    working_hours:   supplier.working_hours ?? '',
    google_map_link: supplier.google_map_link ?? '',
    instagram:       supplier.instagram ?? '',
    facebook:        supplier.facebook ?? '',
    linkedin:        supplier.linkedin ?? '',
    twitter:         supplier.twitter ?? '',
    youtube:         supplier.youtube ?? '',
    seo_title:       supplier.seo_title ?? '',
    seo_description: supplier.seo_description ?? '',
    seo_keywords:    supplier.seo_keywords ?? '',
    og_image:        supplier.og_image ?? '',
  })

  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    gallery: true, certifications: true, documents: true, reviews: true,
    ...(supplier.section_visibility ?? {}),
  })

  // Gallery state
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery)
  const [newGalleryUrl, setNewGalleryUrl] = useState('')
  const [newGalleryType, setNewGalleryType] = useState<'image' | 'video'>('image')
  const [newGalleryCaption, setNewGalleryCaption] = useState('')

  // Cert state
  const [certs, setCerts] = useState<Certification[]>(initialCerts)
  const [newCert, setNewCert] = useState({ title: '', issuer: '', issued_date: '', expiry_date: '', image_url: '' })

  // Status
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  async function save() {
    setSaving(true); setSaved(false); setError(null)
    const payload: Record<string, any> = {
      brand_slug:      form.brand_slug || null,
      tagline:         form.tagline || null,
      logo_url:        form.logo_url || null,
      banner_image:    form.banner_image || null,
      description:     form.description || null,
      about_company:   form.about_company || null,
      founded_year:    form.founded_year ? parseInt(form.founded_year) : null,
      employee_count:  form.employee_count ? parseInt(form.employee_count) : null,
      years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      countries_served: form.countries_served ? parseInt(form.countries_served) : null,
      website:         form.website || null,
      phone:           form.phone || null,
      whatsapp:        form.whatsapp || null,
      business_email:  form.business_email || null,
      working_hours:   form.working_hours || null,
      google_map_link: form.google_map_link || null,
      instagram:       form.instagram || null,
      facebook:        form.facebook || null,
      linkedin:        form.linkedin || null,
      twitter:         form.twitter || null,
      youtube:         form.youtube || null,
      seo_title:       form.seo_title || null,
      seo_description: form.seo_description || null,
      seo_keywords:    form.seo_keywords || null,
      og_image:        form.og_image || null,
      section_visibility: sectionVisibility,
    }

    const { error: err } = await (supabase.from('suppliers') as any).update(payload).eq('id', supplier.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function addGalleryItem() {
    if (!newGalleryUrl.trim()) return
    const maxOrder = gallery.length > 0 ? Math.max(...gallery.map((g) => g.sort_order)) : -1
    const { data, error: err } = await (supabase.from('brand_gallery' as any) as any).insert({
      supplier_id: supplier.id,
      url: newGalleryUrl.trim(),
      type: newGalleryType,
      caption: newGalleryCaption.trim() || null,
      sort_order: maxOrder + 1,
    }).select().single()
    if (!err && data) {
      setGallery((g) => [...g, data as GalleryItem])
      setNewGalleryUrl(''); setNewGalleryCaption('')
    }
  }

  async function removeGalleryItem(id: string) {
    await (supabase.from('brand_gallery' as any) as any).delete().eq('id', id)
    setGallery((g) => g.filter((item) => item.id !== id))
  }

  async function addCert() {
    if (!newCert.title.trim()) return
    const { data, error: err } = await (supabase.from('brand_certifications' as any) as any).insert({
      supplier_id: supplier.id,
      title: newCert.title.trim(),
      issuer: newCert.issuer.trim() || null,
      issued_date: newCert.issued_date || null,
      expiry_date: newCert.expiry_date || null,
      image_url: newCert.image_url.trim() || null,
    }).select().single()
    if (!err && data) {
      setCerts((c) => [...c, data as Certification])
      setNewCert({ title: '', issuer: '', issued_date: '', expiry_date: '', image_url: '' })
    }
  }

  async function removeCert(id: string) {
    await (supabase.from('brand_certifications' as any) as any).delete().eq('id', id)
    setCerts((c) => c.filter((cert) => cert.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#0B1F4D] text-[#0B1F4D] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <SaveBar saved={saved} saving={saving} error={error} onSave={save} />

        {/* ── Basic Info ── */}
        {tab === 'basic' && (
          <div className="space-y-5">
            <Field label="Brand Slug" hint="URL-friendly identifier: /brand/your-slug — lowercase letters, numbers, hyphens only">
              <div className="flex gap-2">
                <input
                  className={INPUT}
                  value={form.brand_slug}
                  onChange={(e) => set('brand_slug', slugify(e.target.value))}
                  placeholder="your-brand-name"
                />
                <button
                  type="button"
                  onClick={() => set('brand_slug', slugify(supplier.trade_name ?? ''))}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  Auto-fill
                </button>
              </div>
              {form.brand_slug && (
                <p className="text-xs text-gray-400 mt-1">
                  Preview URL: <span className="font-mono text-[#0B1F4D]">/brand/{form.brand_slug}</span>
                </p>
              )}
            </Field>
            <Field label="Tagline" hint="A short, punchy description shown below your brand name">
              <input className={INPUT} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Quality products for global buyers" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Founded Year">
                <input className={INPUT} type="number" value={form.founded_year} onChange={(e) => set('founded_year', e.target.value)} placeholder="2010" min="1900" max={new Date().getFullYear()} />
              </Field>
              <Field label="Years of Experience">
                <input className={INPUT} type="number" value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} placeholder="15" min="0" />
              </Field>
              <Field label="Employee Count">
                <input className={INPUT} type="number" value={form.employee_count} onChange={(e) => set('employee_count', e.target.value)} placeholder="50" min="1" />
              </Field>
              <Field label="Countries Served">
                <input className={INPUT} type="number" value={form.countries_served} onChange={(e) => set('countries_served', e.target.value)} placeholder="10" min="0" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
              <Field label="Logo" hint="Square, at least 200×200px">
                <ImageUpload value={form.logo_url || null} onChange={(url) => set('logo_url', url)} folder="logos" aspect="square" label="Logo" />
              </Field>
              <Field label="Banner image" hint="Wide hero banner for your brand page (at least 1200×300px)">
                <ImageUpload value={form.banner_image || null} onChange={(url) => set('banner_image', url)} folder="banners" aspect="wide" label="Banner" />
              </Field>
            </div>
          </div>
        )}

        {/* ── About ── */}
        {tab === 'about' && (
          <div className="space-y-5">
            <Field label="Short Description" hint="Brief overview shown in search results and product cards">
              <textarea className={TEXTAREA} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="A leading manufacturer of..." rows={3} />
            </Field>
            <Field label="About Company" hint="Detailed company story shown on your brand profile page">
              <textarea className={TEXTAREA} value={form.about_company} onChange={(e) => set('about_company', e.target.value)} placeholder="Founded in..., we specialize in..." rows={6} />
            </Field>
          </div>
        )}

        {/* ── Gallery ── */}
        {tab === 'gallery' && (
          <div className="space-y-6">
            {/* Add form */}
            <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Add Media</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select className={INPUT} value={newGalleryType} onChange={(e) => { setNewGalleryType(e.target.value as 'image' | 'video'); setNewGalleryUrl('') }}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </Field>
                <Field label="Caption (optional)">
                  <input className={INPUT} value={newGalleryCaption} onChange={(e) => setNewGalleryCaption(e.target.value)} placeholder="Product in use" />
                </Field>
              </div>
              {newGalleryType === 'image' ? (
                <Field label="Image">
                  <ImageUpload value={newGalleryUrl || null} onChange={(url) => setNewGalleryUrl(url)} folder="gallery" aspect="wide" label="Gallery image" />
                </Field>
              ) : (
                <Field label="Video URL" hint="YouTube / Vimeo / direct video link">
                  <input className={INPUT} value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </Field>
              )}
              <button onClick={addGalleryItem} className="px-4 py-2 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold hover:bg-[#162d6e] transition-colors">
                Add to Gallery
              </button>
            </div>

            {/* Existing gallery */}
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {gallery.map((item) => (
                  <div key={item.id} className="group relative rounded-xl overflow-hidden border border-gray-100 aspect-square bg-gray-50">
                    {item.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.caption ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {item.caption && (
                      <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{item.caption}</p>
                    )}
                    <button
                      onClick={() => removeGalleryItem(item.id)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No media added yet</p>
            )}
          </div>
        )}

        {/* ── Certifications ── */}
        {tab === 'certs' && (
          <div className="space-y-6">
            {/* Add form */}
            <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Add Certification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Certificate Title *">
                  <input className={INPUT} value={newCert.title} onChange={(e) => setNewCert((c) => ({ ...c, title: e.target.value }))} placeholder="ISO 9001:2015" />
                </Field>
                <Field label="Issuing Body">
                  <input className={INPUT} value={newCert.issuer} onChange={(e) => setNewCert((c) => ({ ...c, issuer: e.target.value }))} placeholder="Bureau Veritas" />
                </Field>
                <Field label="Issue Date">
                  <input className={INPUT} type="date" value={newCert.issued_date} onChange={(e) => setNewCert((c) => ({ ...c, issued_date: e.target.value }))} />
                </Field>
                <Field label="Expiry Date">
                  <input className={INPUT} type="date" value={newCert.expiry_date} onChange={(e) => setNewCert((c) => ({ ...c, expiry_date: e.target.value }))} />
                </Field>
              </div>
              <Field label="Certificate Image">
                <ImageUpload value={newCert.image_url || null} onChange={(url) => setNewCert((c) => ({ ...c, image_url: url }))} folder="gallery" aspect="wide" label="Certificate" />
              </Field>
              <button onClick={addCert} className="px-4 py-2 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold hover:bg-[#162d6e] transition-colors">
                Add Certification
              </button>
            </div>

            {/* List */}
            {certs.length > 0 ? (
              <div className="space-y-2">
                {certs.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{cert.title}</p>
                      <p className="text-xs text-gray-400">{cert.issuer ?? ''} {cert.issued_date ? `· ${new Date(cert.issued_date).getFullYear()}` : ''}</p>
                    </div>
                    <button onClick={() => removeCert(cert.id)} className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No certifications added yet</p>
            )}
          </div>
        )}

        {/* ── Contact ── */}
        {tab === 'contact' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Phone">
                <input className={INPUT} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
              </Field>
              <Field label="WhatsApp" hint="Number with country code, digits only e.g. 15550000000">
                <input className={INPUT} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="15550000000" />
              </Field>
              <Field label="Business Email">
                <input className={INPUT} type="email" value={form.business_email} onChange={(e) => set('business_email', e.target.value)} placeholder="info@yourbrand.com" />
              </Field>
              <Field label="Website">
                <input className={INPUT} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourbrand.com" />
              </Field>
            </div>
            <Field label="Working Hours" hint="Multi-line is fine, e.g. Mon–Fri 9am–6pm (GMT+3)">
              <textarea className={TEXTAREA} value={form.working_hours} onChange={(e) => set('working_hours', e.target.value)} rows={3} placeholder="Mon–Fri: 9:00 AM – 6:00 PM (GMT+3)" />
            </Field>
            <Field label="Google Maps Link">
              <input className={INPUT} value={form.google_map_link} onChange={(e) => set('google_map_link', e.target.value)} placeholder="https://maps.google.com/?q=..." />
            </Field>
          </div>
        )}

        {/* ── Social ── */}
        {tab === 'social' && (
          <div className="space-y-5">
            {[
              { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourbrand' },
              { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/yourbrand' },
              { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/yourbrand' },
              { key: 'twitter',   label: 'Twitter / X', placeholder: 'https://x.com/yourbrand' },
              { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourbrand' },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <input className={INPUT} value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} />
              </Field>
            ))}
          </div>
        )}

        {/* ── SEO ── */}
        {tab === 'seo' && (
          <div className="space-y-5">
            <Field label="SEO Title" hint="Shown in browser tab and search results (50–60 chars ideal)">
              <input className={INPUT} value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="YourBrand — Wholesale Supplier · TTAI EMA" maxLength={70} />
              <p className="text-xs text-gray-400 mt-1">{form.seo_title.length}/70</p>
            </Field>
            <Field label="SEO Description" hint="Shown below title in search results (120–160 chars ideal)">
              <textarea className={TEXTAREA} value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} rows={3} placeholder="Discover high-quality products from YourBrand..." maxLength={200} />
              <p className="text-xs text-gray-400 mt-1">{form.seo_description.length}/200</p>
            </Field>
            <Field label="Keywords" hint="Comma-separated keywords for search engines">
              <input className={INPUT} value={form.seo_keywords} onChange={(e) => set('seo_keywords', e.target.value)} placeholder="wholesale, bulk, manufacturer, ..." />
            </Field>
            <Field label="Open Graph Image" hint="Shown when sharing your brand page on social media (1200×630px)">
              <ImageUpload value={form.og_image || null} onChange={(url) => set('og_image', url)} folder="banners" aspect="wide" label="Share image" />
            </Field>
          </div>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Section Visibility</h3>
              <p className="text-xs text-gray-400 mb-4">Control which sections appear on your public brand page.</p>
              <div className="space-y-2.5">
                {[
                  { key: 'gallery',        label: 'Gallery & Media' },
                  { key: 'certifications', label: 'Certifications & Documents' },
                  { key: 'reviews',        label: 'Customer Reviews' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div
                      onClick={() => setSectionVisibility((s) => ({ ...s, [key]: !s[key] }))}
                      className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${sectionVisibility[key] !== false ? 'bg-[#0B1F4D]' : 'bg-gray-200'}`}
                      style={{ height: '22px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${sectionVisibility[key] !== false ? 'translate-x-[18px]' : ''}`} style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className={`ml-auto text-xs font-medium ${sectionVisibility[key] !== false ? 'text-green-600' : 'text-gray-400'}`}>
                      {sectionVisibility[key] !== false ? 'Visible' : 'Hidden'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Brand Page Preview</h3>
              {form.brand_slug ? (
                <a href={`/brand/${form.brand_slug}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Brand Page
                </a>
              ) : (
                <p className="text-sm text-gray-400">Set a brand slug (Basic Info tab) to publish your page</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
