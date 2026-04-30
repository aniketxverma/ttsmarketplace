'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/validation/schemas'

const ROLES = [
  { value: 'buyer',           label: 'Buyer',           desc: 'Purchase products from verified suppliers' },
  { value: 'business_client', label: 'Business Client', desc: 'B2B purchasing with volume discounts' },
  { value: 'supplier',        label: 'Supplier',        desc: 'List and sell your products' },
  { value: 'broker',          label: 'Broker',          desc: 'Mediate deals and earn commissions' },
]

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('buyer')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const parsed = registerSchema.safeParse({
      email:    formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      role:     selectedRole,
    })

    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName, requested_role: parsed.data.role },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ full_name: parsed.data.fullName, role: parsed.data.role })
        .eq('id', data.user.id)
    }

    // If email confirmation is disabled in Supabase, session exists immediately
    if (data.session) {
      const role = parsed.data.role
      if (role === 'supplier') window.location.href = '/supplier/onboarding'
      else if (role === 'broker') window.location.href = '/broker/register'
      else window.location.href = '/buyer'
    } else {
      // Email confirmation still on — send to login
      window.location.href = '/login'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Create account</h1>
        <p className="text-gray-500 text-sm mt-1">Join the TTAI global trade ecosystem</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full Name *</label>
          <input
            name="fullName"
            type="text"
            required
            placeholder="John Smith"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password *</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Min 8 characters"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">I am a...</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  selectedRole === r.value
                    ? 'border-[#0B1F4D] bg-[#0B1F4D]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`text-sm font-bold ${selectedRole === r.value ? 'text-[#0B1F4D]' : 'text-gray-800'}`}>{r.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {(selectedRole === 'supplier' || selectedRole === 'broker') && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            <strong>Application required.</strong> After registering you'll complete an onboarding form. Your account will be reviewed within 48 hours.
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#0B1F4D] text-white py-3.5 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-[#0B1F4D] hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}
