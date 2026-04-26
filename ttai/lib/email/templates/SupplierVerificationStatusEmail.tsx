import { BaseEmail } from './Base'

interface SupplierVerificationStatusEmailProps {
  legalName: string
  newStatus: string
  reason?: string
  appUrl: string
}

const STATUS_COPY: Record<string, { subject: string; heading: string; body: string }> = {
  under_review: {
    subject: 'Your application is under review',
    heading: 'Application Under Review',
    body: 'Our team is reviewing your supplier application. This usually takes 1-3 business days. We\'ll notify you as soon as a decision is made.',
  },
  active: {
    subject: 'You\'re approved! Your supplier account is active',
    heading: 'Application Approved',
    body: 'Congratulations! Your supplier account has been verified and is now active. You can start listing products on the TTAI marketplace.',
  },
  suspended: {
    subject: 'Your supplier account has been suspended',
    heading: 'Account Suspended',
    body: 'Your supplier account has been suspended. Please review the reason below and contact our support team if you have questions.',
  },
}

export function SupplierVerificationStatusEmail({
  legalName,
  newStatus,
  reason,
  appUrl,
}: SupplierVerificationStatusEmailProps) {
  const copy = STATUS_COPY[newStatus] ?? {
    subject: `Account status update: ${newStatus}`,
    heading: 'Account Status Updated',
    body: `Your account status has been updated to: ${newStatus}`,
  }

  return (
    <BaseEmail preview={copy.subject}>
      <h2>{copy.heading}</h2>
      <p>Dear {legalName},</p>
      <p>{copy.body}</p>
      {reason && (
        <div className="card">
          <p className="label">Admin Note</p>
          <p className="value">{reason}</p>
        </div>
      )}
      {newStatus === 'active' && (
        <p style={{ marginTop: 24 }}>
          <a href={`${appUrl}/supplier`} className="btn">Go to Dashboard</a>
        </p>
      )}
    </BaseEmail>
  )
}
