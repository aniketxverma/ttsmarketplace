import * as Sentry from '@sentry/nextjs'
import { resend } from './client'
import type { ReactElement } from 'react'

interface SendEmailParams {
  to: string
  subject: string
  react: ReactElement
  idempotencyKey?: string
}

export async function sendEmail(params: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[email:dev]', params.to, params.subject)
    return { id: 'dev-mock' }
  }

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: params.to,
      subject: params.subject,
      react: params.react,
      headers: params.idempotencyKey ? { 'X-Idempotency-Key': params.idempotencyKey } : undefined,
    })
    return result
  } catch (err) {
    Sentry.captureException(err, { extra: { emailTo: params.to, subject: params.subject } })
    throw err
  }
}

export function sendEmailFireAndForget(params: SendEmailParams) {
  Promise.resolve(sendEmail(params)).catch((err) => {
    console.error('[email:error]', params.subject, err)
  })
}
