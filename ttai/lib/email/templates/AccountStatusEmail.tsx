import { BaseEmail } from './Base'

interface AccountStatusEmailProps {
  fullName: string
  appUrl: string
  status: 'approved' | 'rejected'
  role?: string | null
}

const ROLE_COPY: Record<string, { dash: string; cta: string; perks: string[] }> = {
  supplier: {
    dash: '/supplier',
    cta: 'Go to your supplier dashboard',
    perks: ['Set up your store & upload products', 'Receive buyer enquiries & purchase requests', 'Get your Verified badge and appear in the directory'],
  },
  broker: {
    dash: '/broker',
    cta: 'Open your broker dashboard',
    perks: ['Refer buyers & suppliers and earn commission', 'Track your deals and points', 'Access both sides of the marketplace'],
  },
  business_client: {
    dash: '/buyer',
    cta: 'Start sourcing',
    perks: ['Browse verified suppliers & factories', 'Send purchase requests and get quotes', 'Buy wholesale with EU VAT compliance'],
  },
  buyer: {
    dash: '/buyer',
    cta: 'Start shopping',
    perks: ['Browse the marketplace', 'Send purchase requests and get quotes', 'Track your orders in real-time'],
  },
}

export function AccountStatusEmail({ fullName, appUrl, status, role }: AccountStatusEmailProps) {
  const copy = ROLE_COPY[role ?? 'buyer'] ?? ROLE_COPY.buyer

  if (status === 'rejected') {
    return (
      <BaseEmail preview="Update on your TTAI EMA account">
        <h2>Hello {fullName},</h2>
        <p>Thank you for your interest in TTAI EMA. After reviewing your application, we&apos;re unable to approve your account at this time.</p>
        <p>If you believe this was a mistake or you&apos;d like to provide more details about your business, just reply to this email and our team will take another look.</p>
        <p style={{ marginTop: 24 }}>
          <a href={`${appUrl}/login`} className="btn">Contact us</a>
        </p>
      </BaseEmail>
    )
  }

  return (
    <BaseEmail preview={`Your TTAI EMA account is approved, ${fullName}`}>
      <h2>You&apos;re approved, {fullName}! 🎉</h2>
      <p>Welcome to TTAI EMA — your account has been verified and is now fully active.</p>
      <p>Here&apos;s what you can do right now:</p>
      <div className="card">
        {copy.perks.map((p, i) => <p key={i}>• {p}</p>)}
      </div>
      <p style={{ marginTop: 24 }}>
        <a href={`${appUrl}${copy.dash}`} className="btn">{copy.cta}</a>
      </p>
      <p style={{ marginTop: 16, fontSize: 13, color: '#6b7280' }}>
        Need help getting started? Just reply to this email — we&apos;re here to help.
      </p>
    </BaseEmail>
  )
}
