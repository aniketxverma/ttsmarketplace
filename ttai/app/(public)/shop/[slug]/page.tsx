import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Package, Phone, ShoppingBag, ChevronRight, Store } from 'lucide-react'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: pos } = await (supabase.from('supplier_pos') as any)
    .select('shop_name, shop_tagline, shop_logo, suppliers(trade_name, logo_url)')
    .eq('shop_slug', params.slug)
    .eq('shop_active', true)
    .maybeSingle() as { data: any }

  if (!pos) return { title: 'Tienda Online · TTAI' }
  const name = pos.shop_name ?? pos.suppliers?.trade_name ?? 'Tienda Online'
  return {
    title: `${name} · Tienda Online TTAI`,
    description: pos.shop_tagline ?? `Compra online en ${name}`,
    openGraph: {
      images: pos.shop_logo ?? pos.suppliers?.logo_url
        ? [{ url: pos.shop_logo ?? pos.suppliers.logo_url }]
        : [],
    },
  }
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  // Load the client store POS
  const { data: pos } = await (supabase.from('supplier_pos') as any)
    .select(`
      id, name, shop_name, shop_tagline, shop_logo, shop_active, shop_slug,
      supplier_id,
      pos_locations(address_line1, city, region, postal_code, country, latitude, longitude),
      pos_details(manager_name, phone, whatsapp, notes, services_offered),
      suppliers(id, trade_name, brand_slug, logo_url, whatsapp, phone)
    `)
    .eq('shop_slug', params.slug)
    .maybeSingle() as { data: any }

  // If not found or shop not active, show appropriate page
  if (!pos) notFound()

  if (!pos.shop_active) {
    return <ShopComingSoon pos={pos} />
  }

  const supplier = pos.suppliers as any
  const loc      = pos.pos_locations as any
  const det      = pos.pos_details   as any

  const shopName = pos.shop_name ?? supplier?.trade_name ?? pos.name
  const shopLogo = pos.shop_logo ?? supplier?.logo_url ?? null

  // Fetch published products from this supplier
  const { data: productsRaw } = await supabase
    .from('products')
    .select('id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, product_images(url, sort_order), categories(name, slug)')
    .eq('supplier_id', pos.supplier_id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(48) as { data: any[] | null }

  const products = (productsRaw ?? []).map((p: any) => {
    const imgs = ((p.product_images ?? []) as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order)
    return { ...p, thumb: imgs[0]?.url ?? null, category: (p.categories as any)?.name ?? null }
  })

  // Group by category
  const byCategory = new Map<string, typeof products>()
  products.forEach(p => {
    const cat = p.category ?? 'Productos'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(p)
  })

  const waHref = det?.whatsapp
    ? `https://wa.me/${det.whatsapp.replace(/\D/g,'')}?text=Hola! Me gustaría hacer un pedido en ${shopName}`
    : supplier?.whatsapp
      ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hola! Me gustaría hacer un pedido en ${shopName}`
      : null

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1F4D] via-[#1a3a7a] to-[#0d3060]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 overflow-hidden bg-white shadow-2xl flex-shrink-0">
              {shopLogo ? (
                <Image src={shopLogo} alt={shopName} width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0B1F4D]">
                  <ShoppingBag className="w-10 h-10 text-white/60" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">Tienda Online</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-bold">Activa</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">{shopName}</h1>
              {pos.shop_tagline && (
                <p className="text-white/60 text-sm mb-3">{pos.shop_tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {(loc?.city || loc?.address_line1) && (
                  <span className="flex items-center gap-1 text-white/55 text-xs">
                    <MapPin className="w-3 h-3" />
                    {[loc.address_line1, loc.city].filter(Boolean).join(', ')}
                  </span>
                )}
                {supplier?.brand_slug && (
                  <Link href={`/brand/${supplier.brand_slug}`}
                    className="flex items-center gap-1 text-[#F5A623] hover:text-amber-300 text-xs font-bold transition-colors">
                    <Store className="w-3 h-3" />Ver proveedor
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* CTA */}
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Pedir por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Products ──────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No hay productos disponibles aún.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Array.from(byCategory.entries()).map(([cat, prods]) => (
              <div key={cat}>
                <div className="flex items-center gap-2.5 mb-5">
                  <h2 className="text-base font-extrabold text-[#0B1F4D]">{cat}</h2>
                  <span className="text-[11px] bg-[#0B1F4D]/8 text-[#0B1F4D] font-bold px-2 py-0.5 rounded-full border border-[#0B1F4D]/10">
                    {prods.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {prods.map((p: any) => (
                    <Link key={p.id} href={`/product/${p.slug ?? p.id}`}
                      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                      {/* Image */}
                      <div className="relative aspect-square bg-[#F5F5F3]">
                        {p.thumb ? (
                          <Image src={p.thumb} alt={p.name} fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width:640px) 50vw, 25vw" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-200" />
                          </div>
                        )}
                        {/* Stock indicator */}
                        {p.stock_qty !== null && p.stock_qty === 0 && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="text-xs font-bold text-red-500 bg-white px-2 py-1 rounded-full shadow-sm">Agotado</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">{p.name}</h3>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[13px] font-extrabold text-[#0B1F4D]">
                            {p.price_cents > 0 ? fmt(p.price_cents, p.currency_code) : (
                              <span className="text-gray-400 font-normal italic text-[11px]">Consultar</span>
                            )}
                          </span>
                          {p.min_order_qty && (
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">MOQ {p.min_order_qty}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Powered by TTAI footer */}
        <div className="mt-16 flex items-center justify-center gap-2 text-xs text-gray-300">
          <span>Tienda desarrollada por</span>
          <Link href="/" className="font-bold text-gray-400 hover:text-[#0B1F4D] transition-colors">TTAI EMA</Link>
        </div>
      </div>
    </div>
  )
}

// ── Coming Soon page for inactive shops ────────────────────────────────────────
function ShopComingSoon({ pos }: { pos: any }) {
  const supplier = pos.suppliers as any
  const shopName = pos.shop_name ?? supplier?.trade_name ?? pos.name

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] mx-auto mb-6 flex items-center justify-center shadow-xl">
          <ShoppingBag className="w-10 h-10 text-white/70" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B1F4D] mb-2">{shopName}</h1>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          Esta tienda online estará disponible muy pronto.<br />
          Estamos preparando todo para ofrecerte la mejor experiencia.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Próximamente
        </div>
        {supplier?.brand_slug && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/brand/${supplier.brand_slug}`}
              className="flex items-center justify-center gap-2 bg-[#0B1F4D] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#162d6e] transition-colors shadow-sm">
              <Store className="w-4 h-4" />Ver proveedor
            </Link>
            <Link href="/marketplace"
              className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-bold text-sm hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors">
              Explorar marketplace
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
