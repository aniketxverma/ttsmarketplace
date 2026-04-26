"use client"

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loginAction } from './actions'
import type { LoginState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [state, action] = useFormState<LoginState, FormData>(loginAction, null)

  return (
    <form action={action}>
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

      <input name="email" type="email" required />
      <input name="password" type="password" required />

      {state?.error && <p>{state.error}</p>}

      <SubmitButton />
    </form>
  )
}