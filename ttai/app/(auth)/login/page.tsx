'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validation/schemas'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
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

    // Determine where to redirect based on role
    let dest = '/buyer'
    if (redirectTo) {
      dest = redirectTo
    } else if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
        
      const role = profile?.role
      if (role === 'admin') dest = '/admin'
      else if (role === 'supplier') dest = '/supplier'
      else if (role === 'broker') dest = '/broker'
    }

    window.location.href = dest
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your TTAI account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link href="/reset-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create account
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-xl border shadow-sm p-8 flex justify-center text-sm text-muted-foreground">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}