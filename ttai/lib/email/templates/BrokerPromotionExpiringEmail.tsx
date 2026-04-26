import { BaseEmail } from './Base'

interface BrokerPromotionExpiringEmailProps {
  brokerName: string
  promotionTitle: string
  expiresAt: string
  appUrl: string
}

export function BrokerPromotionExpiringEmail({
  brokerName,
  promotionTitle,
  expiresAt,
  appUrl,
}: BrokerPromotionExpiringEmailProps) {
  return (
    <BaseEmail preview={`Promotion expiring soon: ${promotionTitle}`}>
      <h2>Promotion Expiring Soon</h2>
      <p>Hi {brokerName}, one of your active promotions is expiring in less than 24 hours.</p>
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <p className="label">Promotion</p>
          <p className="value">{promotionTitle}</p>
        </div>
        <div>
          <p className="label">Expires At</p>
          <p className="value">{expiresAt}</p>
        </div>
      </div>
      <p>Renew or extend the promotion from your broker dashboard before it expires.</p>
      <p style={{ marginTop: 24 }}>
        <a href={`${appUrl}/broker/promotions`} className="btn">Manage Promotions</a>
      </p>
    </BaseEmail>
  )
}
