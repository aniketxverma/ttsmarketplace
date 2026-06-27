import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import {
  FileSpreadsheet, FileText, FileImage, File as FileIcon, Download,
  Play, MessageCircle, Mail, Phone, Lock, Package,
} from 'lucide-react'

interface Doc { id: string; doc_type: string; file_url: string; uploaded_at: string; title?: string | null; file_name?: string | null; file_size_bytes?: number | null }
interface Video { id: string; url: string; caption: string | null }

interface Props {
  documents: Doc[]
  videos: Video[]
  supplier: {
    trade_name?: string | null; legal_name?: string | null
    whatsapp?: string | null; phone?: string | null; business_email?: string | null
  }
  contactUnlocked: boolean
  isAuthenticated: boolean
  className?: string
}

const DOC_TYPE_LABELS: Record<string, string> = {
  price_list: 'Price List', catalog: 'Product Catalog', brochure: 'Brochure',
  tax_certificate: 'Tax Certificate', business_license: 'Business License',
  vat_certificate: 'VAT Certificate', bank_proof: 'Bank Proof',
}
function docIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' }
  if (ext === 'pdf') return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-50' }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return { Icon: FileImage, color: 'text-blue-500', bg: 'bg-blue-50' }
  if (['doc', 'docx'].includes(ext)) return { Icon: FileText, color: 'text-blue-700', bg: 'bg-blue-50' }
  return { Icon: FileIcon, color: 'text-gray-500', bg: 'bg-gray-100' }
}
function fmtSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return ''
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0, n = bytes
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`
}
/** Best-effort poster image for a video URL (YouTube/Vimeo → thumbnail). */
function videoThumb(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`
  return null
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100">
      <h3 className="text-xs font-black uppercase tracking-widest text-[#0B1F4D]">{title}</h3>
    </div>
    <div className="p-3">{children}</div>
  </div>
)

export function BrandSidebar({ documents, videos, supplier, contactUnlocked, isAuthenticated, className }: Props) {
  const t = useT()
  const name = supplier.trade_name ?? supplier.legal_name ?? 'this supplier'
  const wa = supplier.whatsapp ? supplier.whatsapp.replace(/\D/g, '') : null
  const catalogMsg = encodeURIComponent(`Hi! I found ${name} on TTAI and I'd like to request your full catalogue and price list.`)

  return (
    <aside className={className}>
      <div className="space-y-4">

        {/* ── Supplier Documents ── */}
        {documents.length > 0 && (
          <Panel title={t("Supplier Documents")}>
            <div className="space-y-1.5">
              {documents.map((doc) => {
                const { Icon, color, bg } = docIcon(doc.file_name ?? doc.file_url)
                const label = doc.title || DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type.replace(/_/g, ' ')
                return (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" download
                    className="group flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 flex-shrink-0 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate capitalize">{t(label)}</p>
                      {fmtSize(doc.file_size_bytes) && <p className="text-[11px] text-gray-400">{fmtSize(doc.file_size_bytes)}</p>}
                    </div>
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-[#0B1F4D] transition-colors flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          </Panel>
        )}

        {/* ── Supplier Videos ── */}
        {videos.length > 0 && (
          <Panel title={t("Supplier Videos")}>
            <div className="grid grid-cols-2 gap-2.5">
              {videos.slice(0, 4).map((v) => {
                const thumb = videoThumb(v.url)
                return (
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
                    className="group relative aspect-video rounded-xl overflow-hidden bg-gray-900 ring-1 ring-gray-100">
                    {thumb
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={thumb} alt={v.caption ?? 'Video'} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      : <video src={v.url} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata" />}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-[#0B1F4D] ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {v.caption && (
                      <span className="absolute bottom-0 inset-x-0 px-2 py-1 text-[10px] font-semibold text-white bg-gradient-to-t from-black/70 to-transparent truncate">{v.caption}</span>
                    )}
                  </a>
                )
              })}
            </div>
          </Panel>
        )}

        {/* ── Contact ── */}
        <Panel title={t("Contact Supplier")}>
          {contactUnlocked ? (
            <div className="space-y-2">
              {wa && (
                <a href={`https://wa.me/${wa}?text=${catalogMsg}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 hover:bg-green-400 text-white py-2.5 text-sm font-bold transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {supplier.business_email && (
                <a href={`mailto:${supplier.business_email}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-[#0B1F4D] py-2.5 text-sm font-bold transition-colors">
                  <Mail className="w-4 h-4" /> {t("Send Message")}
                </a>
              )}
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-[#0B1F4D] py-2.5 text-sm font-bold transition-colors">
                  <Phone className="w-4 h-4" /> {t("Call")}
                </a>
              )}
              {wa && (
                <a href={`https://wa.me/${wa}?text=${catalogMsg}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-bold transition-colors">
                  <Download className="w-4 h-4" /> {t("Request Full Catalog")}
                </a>
              )}
            </div>
          ) : (
            <Link href={isAuthenticated ? '/pricing' : '/register'}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#F5A623] hover:bg-[#fbb93a] text-[#0B1F4D] py-2.5 text-sm font-extrabold transition-colors">
              <Lock className="w-4 h-4" /> {t("Unlock contact")}
            </Link>
          )}
        </Panel>

        {/* ── Bulk orders note ── */}
        <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4 flex gap-3">
          <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-[#0B1F4D] flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0B1F4D]">{t("Bulk Orders & Better Prices")}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t("Contact us for bulk orders, special offers and long-term cooperation.")}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
