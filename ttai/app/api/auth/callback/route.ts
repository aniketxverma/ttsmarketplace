import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { WelcomeEmail } from '@/lib/email/templates/WelcomeEmail'
import React from 'react'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const isNew = data.user.created_at === data.user.last_sign_in_at
      if (isNew) {
        const admin = createAdminClient()
        const { data: profile } = await admin.from('profiles').select('full_name').eq('id', data.user.id).single()
        if (data.user.email) {
          sendEmailFireAndForget({
            to: data.user.email,
            subject: 'Welcome to TTAI!',
            react: React.createElement(WelcomeEmail, {
              fullName: profile?.full_name ?? data.user.email,
              appUrl: process.env.NEXT_PUBLIC_APP_URL ?? origin,
            }),
            idempotencyKey: `welcome-${data.user.id}`,
          })
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth-error`)
}
