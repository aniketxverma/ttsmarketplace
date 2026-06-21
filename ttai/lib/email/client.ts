import nodemailer, { type Transporter } from 'nodemailer'
import { Resend } from 'resend'

// ── Resend (legacy / fallback) ──────────────────────────────────────────────
let _resend: Resend | null = null
export function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

// ── Hostinger SMTP ──────────────────────────────────────────────────────────
// Three mailboxes, each with its own credentials, chosen by purpose:
//   info     → verification / system / transactional notifications
//   contact  → general, customer-facing
//   support  → existing-customer support tickets
export type MailRole = 'info' | 'contact' | 'support'

const ROLE_ENV: Record<MailRole, { user: string; pass: string }> = {
  info: { user: 'SMTP_INFO_USER', pass: 'SMTP_INFO_PASS' },
  contact: { user: 'SMTP_CONTACT_USER', pass: 'SMTP_CONTACT_PASS' },
  support: { user: 'SMTP_SUPPORT_USER', pass: 'SMTP_SUPPORT_PASS' },
}

const _transports: Partial<Record<MailRole, Transporter>> = {}

/** Credentials configured for a role (falls back to the `info` mailbox). */
export function smtpCredsForRole(role: MailRole): { user: string; pass: string } | null {
  const order: MailRole[] = role === 'info' ? ['info'] : [role, 'info']
  for (const r of order) {
    const user = process.env[ROLE_ENV[r].user]
    const pass = process.env[ROLE_ENV[r].pass]
    if (user && pass) return { user, pass }
  }
  return null
}

/** True when at least the `info` mailbox is configured. */
export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && smtpCredsForRole('info'))
}

export function getSmtpTransport(role: MailRole): Transporter | null {
  if (!process.env.SMTP_HOST) return null
  const creds = smtpCredsForRole(role)
  if (!creds) return null

  // Cache one transport per resolved sending user.
  const cacheKey = creds.user as MailRole
  if (_transports[cacheKey]) return _transports[cacheKey]!

  const port = Number(process.env.SMTP_PORT || 465)
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 = implicit SSL; 587 = STARTTLS.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user: creds.user, pass: creds.pass },
  })
  _transports[cacheKey] = transport
  return transport
}
