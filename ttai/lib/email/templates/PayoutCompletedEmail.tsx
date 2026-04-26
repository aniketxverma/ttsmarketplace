import { BaseEmail } from './Base'

interface PayoutCompletedEmailProps {
  recipientName: string
  amountFormatted: string
  transferId: string
}

export function PayoutCompletedEmail({
  recipientName,
  amountFormatted,
  transferId,
}: PayoutCompletedEmailProps) {
  return (
    <BaseEmail preview={`Payout sent — ${amountFormatted}`}>
      <h2>Payout Completed</h2>
      <p>Hi {recipientName}, your payout has been sent to your Stripe account.</p>
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <p className="label">Amount</p>
          <p className="value">{amountFormatted}</p>
        </div>
        <div>
          <p className="label">Transfer ID</p>
          <p className="value" style={{ fontFamily: 'monospace' }}>{transferId}</p>
        </div>
      </div>
      <p>Funds will appear in your bank account within 2-3 business days depending on your Stripe payout schedule.</p>
    </BaseEmail>
  )
}
