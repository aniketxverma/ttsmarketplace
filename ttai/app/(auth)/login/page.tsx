'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validation/schemas'
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader, ShoppingBag, Globe, Shield } from 'lucide-react'

function LoginContent() {
  const searchParams  = useSearchParams()
  const redirectTo    = searchParams.get('redirect')
  const urlError      = searchParams.get('error')

  const [error,    setError]    = useState<string | null>(
    urlError === 'verification_failed' ? 'Email verification failed or link expired. Please try again.' : null
  )
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const parsed = loginSchema.safeParse({
      email:    formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword(parsed.data)

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, approval_status')
        .eq('id', data.user.id)
        .single()

      const status = profile?.approval_status ?? 'pending'
      const role   = profile?.role

      // Rejected users still hit the rejection wall
      if (status === 'rejected') { window.location.href = '/account-rejected'; return }

      // Pending OR approved → land on the role dashboard.
      // (Pending users can use their dashboard; marketplace stays locked until approved.)
      let dest = '/buyer'
      if (status === 'approved' && redirectTo) dest = redirectTo
      else if (role === 'admin')    dest = '/admin'
      else if (role === 'supplier') dest = '/supplier'
      else if (role === 'broker')   dest = '/broker'
      window.location.href = dest
    } else {
      window.location.href = redirectTo ?? '/buyer'
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-[#0B1F4D] via-[#0d2660] to-[#1a3a8a] relative overflow-hidden p-12">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.04]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#F5A623]/10" />

        {/* Logo */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#F5A623]" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">
              TTAI <span className="text-[#F5A623]">EMA</span>
            </span>
          </Link>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Europe & Africa's<br />
            <span className="text-[#F5A623]">Trade Platform</span>
          </h2>
          <p className="text-white/60 leading-relaxed text-base max-w-sm">
            Connect with verified suppliers, browse wholesale products, and grow your business across borders.
          </p>

          {/* Trust chips */}
          <div className="space-y-3">
            {[
              { Icon: Shield, text: '200+ Verified Suppliers' },
              { Icon: Globe,  text: '15+ Countries Connected' },
              { Icon: ShoppingBag, text: '€0 Platform Fee — Free to join' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#F5A623]" />
                </div>
                <span className="text-white/70 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative">
          <p className="text-white/30 text-xs">© 2026 TTAI EMA Marketplace. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 sm:px-10 py-12 bg-[#F4F6FB]">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0B1F4D] flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5 text-[#F5A623]" />
            </div>
            <span className="text-[#0B1F4D] font-extrabold text-lg tracking-tight">
              TTAI <span className="text-[#F5A623]">EMA</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1.5">Sign in to your TTAI EMA account</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition placeholder-gray-300"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                    Password
                  </label>
                  <Link href="/reset-password" className="text-xs font-semibold text-[#0B1F4D] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition placeholder-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B1F4D] hover:bg-[#162d6e] text-white rounded-xl font-extrabold text-sm transition-colors shadow-sm disabled:opacity-60 mt-2"
              >
                {loading
                  ? <><Loader className="w-4 h-4 animate-spin" />Signing in…</>
                  : <>Sign In <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-extrabold text-[#0B1F4D] hover:underline">
              Register Free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <div className="w-8 h-8 border-2 border-[#0B1F4D] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
