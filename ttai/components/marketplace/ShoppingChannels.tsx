import Link from 'next/link'
import { Store, Building2, Globe, ArrowRight } from 'lucide-react'

interface Props {
  /** Optional category slug to carry through to each channel */
  categorySlug?: string | null
  /** Optional heading override */
  title?: string
  subtitle?: string
  /** Compact = smaller padding, used inside busy pages */
  compact?: boolean
}

/**
 * Three ways to shop a product / collection:
 *   1. Supplier Online Shop  — retail, single units direct from the brand
 *   2. Supplier B2B Shop     — wholesale & bulk orders direct from the brand
 *   3. TTAIEMA Online Shop   — TTAI-operated store (dropshipping), everything in one place
 */
export function ShoppingChannels({ categorySlug, title, subtitle, compact = false }: Props) {
  const q = categorySlug ? `?category=${categorySlug}` : ''

  const channels = [
    {
      Icon: Store,
      name: 'Supplier Online Shop',
      desc: 'Buy retail — single units direct from the supplier’s own store.',
      href: `/store${q}`,
      gradient: 'from-purple-600 to-violet-800',
      tag: 'Retail',
    },
    {
      Icon: Building2,
      name: 'Supplier B2B Shop',
      desc: 'Wholesale & bulk orders direct from the supplier — best MOQ pricing.',
      href: `/b2b${q}`,
      gradient: 'from-blue-600 to-blue-900',
      tag: 'Wholesale',
    },
    {
      Icon: Globe,
      name: 'TTAIEMA Online Shop',
      desc: 'Shop everything in one place — TTAI handles fulfilment & shipping.',
      href: `/marketplace${q}`,
      gradient: 'from-[#0B1F4D] to-[#1a3580]',
      tag: 'All products',
    },
  ]

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F4D]">{title}</h2>
          )}
          {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {channels.map(({ Icon, name, desc, href, gradient, tag }) => (
          <Link
            key={name}
            href={href}
            className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
          >
            <div className={`bg-gradient-to-br ${gradient} ${compact ? 'px-4 py-3' : 'px-5 py-4'} flex items-center justify-between`}>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-white/80 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {tag}
              </span>
            </div>
            <div className={`${compact ? 'p-4' : 'p-5'} flex-1 flex flex-col`}>
              <h3 className="font-extrabold text-[#0B1F4D] text-sm group-hover:text-[#162d6e]">{name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-1 flex-1">{desc}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0B1F4D] group-hover:gap-2.5 transition-all">
                Enter shop
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
