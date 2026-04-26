import { createAdminClient } from '@/lib/supabase/admin'

interface GenerateInvoiceParams {
  orderId: string
  type: 'supplier' | 'broker'
}

export async function generateInvoice({ orderId, type }: GenerateInvoiceParams) {
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('id, currency_code, supplier_id, broker_id, buyer_country_id, vat_cents, countries(iso_code)')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  const { data: invoiceNumber } = await admin.rpc('generate_invoice_number')

  const { data: ledger } = await admin
    .from('transaction_ledger')
    .select('supplier_net_cents, broker_net_cents')
    .eq('order_id', orderId)
    .single()

  const amountCents = type === 'supplier'
    ? (ledger?.supplier_net_cents ?? 0)
    : (ledger?.broker_net_cents ?? 0)

  const supplierId = type === 'supplier' ? order.supplier_id : null
  const brokerId = type === 'broker' ? order.broker_id : null
  const buyerCountry = (order.countries as any)?.iso_code ?? null

  const { data: invoice, error } = await admin
    .from('invoices')
    .insert({
      order_id: orderId,
      broker_id: brokerId,
      invoice_number: invoiceNumber as string,
      status: 'issued',
      buyer_country: buyerCountry,
      issued_at: new Date().toISOString(),
      vat_treatment: 'standard',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return invoice
}
