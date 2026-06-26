import { BaseEmail } from './Base'

interface SupplierOnboardingEmailProps {
  supplierName: string
  appUrl: string
  /** Reminder tone — sent when the shop is still empty after the first email. */
  reminder?: boolean
}

/**
 * Sent when a supplier's shop is empty (no products). Tells them exactly what to
 * do to get approved: add products, complete the profile. A `reminder` variant
 * nudges suppliers who still haven't added anything.
 */
export function SupplierOnboardingEmail({ supplierName, appUrl, reminder }: SupplierOnboardingEmailProps) {
  const dash = `${appUrl}/dashboard/products/new`
  return (
    <BaseEmail preview={reminder ? `Reminder: add products to activate ${supplierName}` : `Set up your shop, ${supplierName} — get approved`}>
      <h2>{reminder ? `Your shop is still empty, ${supplierName}` : `Welcome aboard, ${supplierName}!`}</h2>

      {reminder ? (
        <p>We noticed your shop doesn&apos;t have any products yet, so it&apos;s currently <strong>under review</strong> and not visible to buyers. Add a few products and we&apos;ll approve it for the marketplace.</p>
      ) : (
        <p>Your account is ready. Right now your shop is <strong>under review</strong> — to get approved and start appearing in the marketplace, just complete a couple of quick steps.</p>
      )}

      <div className="card-box">
        <p style={{ margin: '0 0 10px', fontWeight: 800, color: '#0B1F4D' }}>To get approved:</p>
        <p style={{ margin: '0 0 6px' }}>① <strong>Add your products</strong> — name, price, photos (the most important step)</p>
        <p style={{ margin: '0 0 6px' }}>② <strong>Complete your shop profile</strong> — logo, banner, company details</p>
        <p style={{ margin: '0' }}>③ <strong>Choose your categories</strong> so buyers can find you</p>
      </div>

      <p style={{ marginTop: 22 }}>
        <a href={dash} className="btn">Add your first products</a>
      </p>

      <p className="muted" style={{ marginTop: 18 }}>
        Once you&apos;ve added products, our team reviews and approves your shop — usually within 1 business day. Need a hand? Just reply to this email.
      </p>
    </BaseEmail>
  )
}
