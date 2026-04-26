import type { ReactNode } from 'react'

interface BaseEmailProps {
  children: ReactNode
  preview?: string
}

export function BaseEmail({ children, preview }: BaseEmailProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {preview && <title>{preview}</title>}
        <style>{`
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111827; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: #0f172a; padding: 24px 32px; }
          .header h1 { margin: 0; color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
          .header span { color: #3b82f6; }
          .body { padding: 32px; }
          .footer { padding: 24px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
          h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
          p { font-size: 14px; line-height: 1.6; margin: 0 0 12px; color: #374151; }
          .card { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>TT<span>AI</span></h1>
          </div>
          <div className="body">{children}</div>
          <div className="footer">
            <p>TTAI Marketplace · Spain · {new Date().getFullYear()}</p>
            <p>You are receiving this email because you have an account on TTAI.</p>
          </div>
        </div>
      </body>
    </html>
  )
}
