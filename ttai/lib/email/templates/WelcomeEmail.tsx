import { BaseEmail } from './Base'

interface WelcomeEmailProps {
  fullName: string
  appUrl: string
}

export function WelcomeEmail({ fullName, appUrl }: WelcomeEmailProps) {
  return (
    <BaseEmail preview={`Welcome to TTAI, ${fullName}`}>
      <h2>Welcome to TTAI, {fullName}!</h2>
      <p>You've successfully joined the TTAI marketplace — Spain's premier B2B agricultural trade platform.</p>
      <p>Here's what you can do right now:</p>
      <div className="card">
        <p>• Browse thousands of verified suppliers</p>
        <p>• Place wholesale orders with EU VAT compliance</p>
        <p>• Track your orders in real-time</p>
      </div>
      <p style={{ marginTop: 24 }}>
        <a href={`${appUrl}/marketplace`} className="btn">Browse Marketplace</a>
      </p>
    </BaseEmail>
  )
}
