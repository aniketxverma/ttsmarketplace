import type { ReactNode } from 'react'

interface BaseEmailProps {
  children: ReactNode
  preview?: string
}

/**
 * Shared email shell — branded header, clean card body, professional footer.
 * Every transactional email renders inside this, so restyling here restyles all.
 * Uses table layout + inline-ish CSS classes for broad email-client support.
 */
export function BaseEmail({ children, preview }: BaseEmailProps) {
  const year = new Date().getFullYear()
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
        {preview && <title>{preview}</title>}
        <style>{`
          body { margin:0; padding:0; background:#eef1f6; -webkit-font-smoothing:antialiased; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
          a { color:#2563eb; }
          .wrap { width:100%; background:#eef1f6; padding:28px 12px; }
          .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 6px 24px rgba(11,31,77,0.08); }
          .header { background:linear-gradient(135deg,#0B1F4D 0%,#162d6e 100%); padding:26px 32px; }
          .brand { font-size:22px; font-weight:800; letter-spacing:-0.02em; color:#ffffff; margin:0; }
          .brand .accent { color:#F5A623; }
          .brand .sub { display:block; font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#9db0d6; margin-top:3px; }
          .bar { height:4px; background:linear-gradient(90deg,#F5A623 0%,#fbbf24 100%); }
          .body { padding:34px 32px 12px; }
          .body h2 { font-size:21px; font-weight:800; letter-spacing:-0.01em; margin:0 0 14px; color:#0B1F4D; }
          .body p { font-size:15px; line-height:1.65; margin:0 0 14px; color:#334155; }
          .btn { display:inline-block; background:#F5A623; color:#0B1F4D !important; padding:13px 26px; border-radius:10px; text-decoration:none; font-weight:800; font-size:15px; }
          .btn-dark { display:inline-block; background:#0B1F4D; color:#ffffff !important; padding:13px 26px; border-radius:10px; text-decoration:none; font-weight:800; font-size:15px; }
          .card-box { background:#f7f9fc; border:1px solid #e7ecf5; border-radius:12px; padding:18px; margin:18px 0; }
          .label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.06em; font-weight:700; }
          .value { font-size:15px; font-weight:700; margin-top:2px; color:#0f172a; }
          .divider { height:1px; background:#e7ecf5; margin:24px 0; border:0; }
          .footer { padding:24px 32px 30px; }
          .footer p { font-size:12px; line-height:1.6; color:#94a3b8; margin:0 0 6px; }
          .footer a { color:#64748b; text-decoration:none; font-weight:600; }
          .muted { font-size:13px; color:#94a3b8; }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="card">
            {/* Header */}
            <div className="header">
              <p className="brand">TTAI<span className="accent">EMA</span>
                <span className="sub">B2B &amp; Retail Marketplace</span>
              </p>
            </div>
            <div className="bar" />

            {/* Body */}
            <div className="body">{children}</div>

            {/* Footer */}
            <hr className="divider" />
            <div className="footer">
              <p>
                <a href="https://ttaiz.com">ttaiz.com</a> &nbsp;·&nbsp;
                <a href="https://ttaiz.com/marketplace">Marketplace</a> &nbsp;·&nbsp;
                <a href="https://ttaiz.com/pricing">Pricing</a> &nbsp;·&nbsp;
                <a href="https://ttaiz.com/outlet">Outlet</a>
              </p>
              <p>TTAIEMA · Spain · © {year}. You received this email because you have an account on TTAIEMA.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
