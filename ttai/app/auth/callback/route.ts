import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const supabase = createClient()

  // ── Pattern 1: PKCE code exchange (OAuth, magic link) ───────────────────
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const next = searchParams.get('next') ?? '/'
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ── Pattern 2: Email OTP (email confirmation, password reset) ────────────
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error && data.session) {
      const next = searchParams.get('next') ?? '/'
      // After email confirmation, send buyer to dashboard, others to login
      const role = (data.session.user.user_metadata as { requested_role?: string })?.requested_role
      let dest = next !== '/' ? next : '/buyer'
      if (role === 'supplier') dest = '/supplier/onboarding'
      else if (role === 'broker') dest = '/broker/register'
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
