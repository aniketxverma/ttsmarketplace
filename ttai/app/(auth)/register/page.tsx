'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/validation/schemas'

const ROLES = [
  { value: 'buyer',           label: 'Buyer — purchase products' },
  { value: 'business_client', label: 'Business Client — B2B purchasing' },
  { value: 'supplier',        label: 'Supplier — sell products' },
  { value: 'broker',          label: 'Broker — mediate transactions' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const parsed = registerSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      role: formData.get('role') || 'buyer',
    })

    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          requested_role: parsed.data.role,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const safeRole = ['buyer', 'business_client'].includes(parsed.data.role)
        ? parsed.data.role
        : 'buyer'

      await supabase
        .from('profiles')
        .update({ full_name: parsed.data.fullName, role: safeRole })
        .eq('id', data.user.id)
    }

    router.push('/verify-email')
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-muted-foreground text-sm">Join the TTAI global trade ecosystem</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Min 8 characters</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="role" className="text-sm font-medium">I am a...</label>
          <select
            id="role"
            name="role"
            defaultValue="buyer"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
