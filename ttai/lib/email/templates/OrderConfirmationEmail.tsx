import { BaseEmail } from './Base'

interface OrderConfirmationEmailProps {
  buyerName: string
  orderId: string
  totalFormatted: string
  vatTreatment: string
  supplierName: string
  appUrl: string
}

export function OrderConfirmationEmail({
  buyerName,
  orderId,
  totalFormatted,
  vatTreatment,
  supplierName,
  appUrl,
}: OrderConfirmationEmailProps) {
  return (
    <BaseEmail preview={`Order confirmed — ${totalFormatted}`}>
      <h2>Order Confirmed</h2>
      <p>Hi {buyerName}, your order has been placed and payment confirmed.</p>
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <p className="label">Order ID</p>
          <p className="value" style={{ fontFamily: 'monospace' }}>{orderId}</p>
        </div>
        <div style={{ marginBottom: 12 }}>
          <p className="label">Supplier</p>
          <p className="value">{supplierName}</p>
        </div>
        <div style={{ marginBottom: 12 }}>
          <p className="label">Total</p>
          <p className="value">{totalFormatted}</p>
        </div>
        <div>
          <p className="label">VAT Treatment</p>
          <p className="value" style={{ textTransform: 'capitalize' }}>{vatTreatment.replace('_', ' ')}</p>
        </div>
      </div>
      <p>The supplier will process and fulfill your order shortly.</p>
      <p style={{ marginTop: 24 }}>
        <a href={`${appUrl}/buyer/orders/${orderId}`} className="btn">View Order</a>
      </p>
    </BaseEmail>
  )
}
