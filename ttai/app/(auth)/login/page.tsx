
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loginAction } from './actions'
import type { LoginState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [state, action] = useFormState<LoginState, FormData>(loginAction, null)

  return (
    <div className="bg-card rounded-xl border shadow-sm p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your TTAI account</p>
      </div>

      <form action={action} className="space-y-4">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Link href="/reset-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{state.error}</p>
        )}

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Register
        </Link>
      </p>
    </div>
  )
}
