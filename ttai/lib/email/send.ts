import * as Sentry from '@sentry/nextjs'
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

/** Record the send in email_log (best-effort; never blocks or throws). */
function logEmail(row: { to_email: string; subject: string; mailbox: string; provider: string; status: 'sent' | 'failed'; error?: string; message_id?: string; html?: string }) {
  void (async () => {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      await (createAdminClient().from('email_log') as any).insert(row)
    } catch {
      // `html` column may not be migrated yet — retry without it so the row still logs.
      try {
        const { html, ...rest } = row
        const { createAdminClient } = await import('@/lib/supabase/admin')
        await (createAdminClient().from('email_log') as any).insert(rest)
      } catch { /* table missing entirely — ignore */ }
    }
  })()
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
        // Lazy import keeps react-dom/server out of the static module graph
        // (Next.js errors if a route-imported module statically imports it).
        const { renderToStaticMarkup } = await import('react-dom/server')
        const html = '<!DOCTYPE html>' + renderToStaticMarkup(params.react)
        const result = await transport.sendMail({
          from: fromHeader(creds.user, role),
          to: params.to,
          subject: params.subject,
          html,
          headers: params.idempotencyKey ? { 'X-Idempotency-Key': params.idempotencyKey } : undefined,
        })
        logEmail({ to_email: params.to, subject: params.subject, mailbox: role, provider: 'smtp', status: 'sent', message_id: result.messageId, html })
        return { id: result.messageId }
      } catch (err) {
        logEmail({ to_email: params.to, subject: params.subject, mailbox: role, provider: 'smtp', status: 'failed', error: (err as Error)?.message })
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
      let html: string | undefined
      try { const { renderToStaticMarkup } = await import('react-dom/server'); html = '<!DOCTYPE html>' + renderToStaticMarkup(params.react) } catch { /* render best-effort */ }
      logEmail({ to_email: params.to, subject: params.subject, mailbox: role, provider: 'resend', status: 'sent', message_id: (result as any)?.data?.id, html })
      return result
    } catch (err) {
      logEmail({ to_email: params.to, subject: params.subject, mailbox: role, provider: 'resend', status: 'failed', error: (err as Error)?.message })
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
