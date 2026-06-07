import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TREATMENT_NOTE: Record<string, string> = {
  standard: 'VAT charged at the standard rate.',
  reverse_charge: 'Reverse charge — VAT to be accounted for by the recipient (EU VAT Directive Art. 196 / domestic reverse charge).',
  export: 'Export outside the EU — exempt from VAT.',
  oss: 'VAT accounted for under the One-Stop-Shop scheme.',
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invoice/${params.id}`)

  // Order (RLS lets the buyer read their own); admins can read any.
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const admin = createAdminClient()

  const { data: order } = await (admin.from('orders') as any)
    .select(`id, buyer_id, supplier_id, subtotal_cents, vat_cents, total_cents, currency_code, created_at, shipping_address,
      order_items(quantity, unit_price_cents, line_total_cents, purchase_unit, vat_rate, products(name)),
      suppliers(trade_name, legal_name, countries(name, iso_code), cities(name))`)
    .eq('id', params.id).single()

  if (!order) notFound()
  if (order.buyer_id !== user.id && me?.role !== 'admin') redirect('/account')

  const { data: invoice } = await (admin.from('invoices') as any)
    .select('*').eq('order_id', params.id).maybeSingle()

  const supplier = order.suppliers as any
  const addr = order.shipping_address as any
  const payload = (invoice?.conditions_payload as any) ?? {}
  const treatment = invoice?.vat_treatment ?? 'standard'
  const currency = order.currency_code
  const items = (order.order_items ?? []) as any[]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Link href="/account" className="text-sm font-semibold text-gray-500 hover:text-[#0B1F4D]">← Back</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 print:shadow-none print:border-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-2xl font-black text-[#0B1F4D]">Invoice</p>
              <p className="text-sm text-gray-400 mt-0.5">{invoice?.invoice_number ?? order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-[#0B1F4D]">TTAIEMA</p>
              <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Seller</p>
              <p className="font-bold text-[#0B1F4D]">{supplier?.trade_name ?? supplier?.legal_name}</p>
              <p className="text-sm text-gray-500">{[supplier?.cities?.name, supplier?.countries?.name].filter(Boolean).join(', ')}</p>
              {payload.seller_country && <p className="text-xs text-gray-400">Country: {payload.seller_country}</p>}
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Bill to</p>
              <p className="font-bold text-[#0B1F4D]">{payload.buyer_company || addr?.fullName}</p>
              {payload.buyer_company && addr?.fullName && <p className="text-sm text-gray-500">{addr.fullName}</p>}
              <p className="text-sm text-gray-500">{[addr?.line1, addr?.city, addr?.postalCode, addr?.country].filter(Boolean).join(', ')}</p>
              {invoice?.buyer_vat_number && <p className="text-xs text-gray-500 mt-0.5">VAT No: <span className="font-semibold">{invoice.buyer_vat_number}</span></p>}
            </div>
          </div>

          {/* Lines */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-wide">
                <th className="py-2">Product</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 font-medium text-gray-800">{it.products?.name ?? '—'}</td>
                  <td className="py-2.5 text-center text-gray-600">{it.quantity} {it.purchase_unit}{it.quantity > 1 ? 's' : ''}</td>
                  <td className="py-2.5 text-right text-gray-600">{fmt(it.unit_price_cents, currency)}</td>
                  <td className="py-2.5 text-right font-semibold text-[#0B1F4D]">{fmt(it.line_total_cents, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto w-full sm:w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{fmt(order.subtotal_cents, currency)}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">VAT ({payload.vat_rate ?? 0}%)</span>
              <span className="font-medium">{fmt(order.vat_cents, currency)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-[#0B1F4D]">Total</span>
              <span className="font-extrabold text-[#0B1F4D] text-lg">{fmt(order.total_cents, currency)}</span>
            </div>
          </div>

          {/* Tax treatment note */}
          <div className="mt-8 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              <span className="font-bold text-[#0B1F4D] uppercase tracking-wide">Tax treatment:</span>{' '}
              {TREATMENT_NOTE[treatment] ?? TREATMENT_NOTE.standard}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
