import { BaseEmail } from './Base'

interface Props {
  buyerName: string
  supplierName: string
  productName: string
  status: 'confirmed' | 'declined'
  priceText?: string | null
  deliveryTime?: string | null
  note?: string | null
  appUrl: string
}

export function PurchaseRequestStatusEmail({ buyerName, supplierName, productName, status, priceText, deliveryTime, note, appUrl }: Props) {
  if (status === 'declined') {
    return (
      <BaseEmail preview={`Update on your request to ${supplierName}`}>
        <h2>Update on your purchase request</h2>
        <p>Hi {buyerName}, unfortunately <strong>{supplierName}</strong> can&apos;t fulfil your request for <strong>{productName}</strong> right now.</p>
        {note && <div className="card-box"><span className="label">Message from the supplier</span><div className="value" style={{ fontWeight: 500 }}>{note}</div></div>}
        <p>You can browse similar products or send a new request anytime.</p>
        <p style={{ marginTop: 22 }}><a href={`${appUrl}/marketplace`} className="btn-dark">Browse the marketplace</a></p>
      </BaseEmail>
    )
  }
  return (
    <BaseEmail preview={`${supplierName} confirmed your request 🎉`}>
      <h2>Your request is confirmed ✅</h2>
      <p>Good news, {buyerName}! <strong>{supplierName}</strong> confirmed your request for <strong>{productName}</strong>.</p>
      <div className="card-box">
        {priceText && (<><span className="label">Confirmed price</span><div className="value">{priceText}</div></>)}
        {deliveryTime && (<><span className="label" style={{ display: 'block', marginTop: 12 }}>Delivery</span><div className="value">{deliveryTime}</div></>)}
        {note && (<><span className="label" style={{ display: 'block', marginTop: 12 }}>Note</span><div className="value" style={{ fontWeight: 500 }}>{note}</div></>)}
      </div>
      <p>Review the details and complete payment from your dashboard.</p>
      <p style={{ marginTop: 22 }}><a href={`${appUrl}/buyer/requests`} className="btn">Review &amp; pay →</a></p>
    </BaseEmail>
  )
}
