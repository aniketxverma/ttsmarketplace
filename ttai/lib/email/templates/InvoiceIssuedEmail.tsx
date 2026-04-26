import { BaseEmail } from './Base'

interface InvoiceIssuedEmailProps {
  recipientName: string
  invoiceNumber: string
  totalFormatted: string
  appUrl: string
}

export function InvoiceIssuedEmail({
  recipientName,
  invoiceNumber,
  totalFormatted,
  appUrl,
}: InvoiceIssuedEmailProps) {
  return (
    <BaseEmail preview={`Invoice ${invoiceNumber} issued — ${totalFormatted}`}>
      <h2>Invoice Issued</h2>
      <p>Hi {recipientName}, your invoice is ready.</p>
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <p className="label">Invoice Number</p>
          <p className="value" style={{ fontFamily: 'monospace' }}>{invoiceNumber}</p>
        </div>
        <div>
          <p className="label">Amount</p>
          <p className="value">{totalFormatted}</p>
        </div>
      </div>
      <p style={{ marginTop: 24 }}>
        <a href={`${appUrl}/buyer/invoices`} className="btn">View Invoice</a>
      </p>
    </BaseEmail>
  )
}
