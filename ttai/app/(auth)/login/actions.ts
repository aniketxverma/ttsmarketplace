'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema } from '@/lib/validation/schemas'

export type LoginState = { error: string } | null

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  const redirectParam = formData.get('redirect') as string | null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  let dest = '/buyer'

  if (redirectParam) {
    dest = redirectParam
  } else {
    const role = profile?.role
    if (role === 'admin') dest = '/admin'
    else if (role === 'supplier') dest = '/supplier'
    else if (role === 'broker') dest = '/broker'
  }

  redirect(dest)
}