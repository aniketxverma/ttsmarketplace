import * as Sentry from '@sentry/nextjs'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import {
  getResendClient,
  getSmtpTransport,
  isSmtpConfigured,
  smtpCredsForRole,
  type MailRole,
} from './client'

interface SendEmailParams {
  to: string
  subject: string
  react: ReactElement
  /** Which mailbox to send from. Defaults to `info`. */
  role?: MailRole
  idempotencyKey?: string
}

/** Friendly From header per mailbox, e.g. "TTAI Marketplace <info@ttaiz.com>". */
function fromHeader(user: string, role: MailRole): string {
  const labels: Record<MailRole, string> = {
    info: 'TTAI Marketplace',
    contact: 'TTAI Marketplace',
    support: 'TTAI Support',
  }
  return `${labels[role]} <${user}>`
}

export async function sendEmail(params: SendEmailParams) {
  const role: MailRole = params.role || 'info'

  // 1) Hostinger SMTP (preferred when configured)
  if (isSmtpConfigured()) {
    const transport = getSmtpTransport(role)
    const creds = smtpCredsForRole(role)
    if (transport && creds) {
      try {
        const html = '<!DOCTYPE html>' + renderToStaticMarkup(params.react)
        const result = await transport.sendMail({
          from: fromHeader(creds.user, role),
          to: params.to,
          subject: params.subject,
          html,
          headers: params.idempotencyKey ? { 'X-Idempotency-Key': params.idempotencyKey } : undefined,
        })
        return { id: result.messageId }
      } catch (err) {
        Sentry.captureException(err, { extra: { emailTo: params.to, subject: params.subject, transport: 'smtp', role } })
        throw err
      }
    }
  }

  // 2) Resend (legacy fallback)
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await getResendClient().emails.send({
        from: process.env.EMAIL_FROM!,
        to: params.to,
        subject: params.subject,
        react: params.react,
        headers: params.idempotencyKey ? { 'X-Idempotency-Key': params.idempotencyKey } : undefined,
      })
      return result
    } catch (err) {
      Sentry.captureException(err, { extra: { emailTo: params.to, subject: params.subject, transport: 'resend' } })
      throw err
    }
  }

  // 3) No provider configured → log in dev
  console.log('[email:dev]', role, params.to, params.subject)
  return { id: 'dev-mock' }
}

export function sendEmailFireAndForget(params: SendEmailParams) {
  Promise.resolve(sendEmail(params)).catch((err) => {
    console.error('[email:error]', params.subject, err)
  })
}
