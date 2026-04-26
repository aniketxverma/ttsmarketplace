import { BaseEmail } from './Base'

interface SupplierOrderEmailProps {
  supplierName: string
  orderId: string
  totalFormatted: string
  appUrl: string
}

export function SupplierOrderEmail({
  supplierName,
  orderId,
  totalFormatted,
  appUrl,
}: SupplierOrderEmailProps) {
  return (
    <BaseEmail preview={`New order received — ${totalFormatted}`}>
      <h2>New Order Received</h2>
      <p>Hi {supplierName}, you have a new order to fulfill.</p>
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <p className="label">Order ID</p>
          <p className="value" style={{ fontFamily: 'monospace' }}>{orderId}</p>
        </div>
        <div>
          <p className="label">Order Value</p>
          <p className="value">{totalFormatted}</p>
        </div>
      </div>
      <p>Please process and fulfill this order promptly. Your payout will be released once fulfilled.</p>
      <p style={{ marginTop: 24 }}>
        <a href={`${appUrl}/supplier/orders/${orderId}`} className="btn">Fulfill Order</a>
      </p>
    </BaseEmail>
  )
}
