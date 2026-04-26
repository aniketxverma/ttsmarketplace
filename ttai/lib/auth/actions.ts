'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema, resetRequestSchema, resetConfirmSchema } from '@/lib/validation/schemas'

export async function signIn(formData: FormData) {
  const supabase = createClient()

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  const redirectTo = (() => {
    switch (profile?.role) {
      case 'admin':    return '/admin'
      case 'supplier': return '/supplier'
      case 'broker':   return '/broker'
      default:         return '/buyer'
    }
  })()

  redirect(redirectTo)
}

export async function signUp(formData: FormData) {
  const supabase = createClient()

  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    role: formData.get('role') || 'buyer',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        requested_role: parsed.data.role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const safeRole = ['buyer', 'business_client'].includes(parsed.data.role)
      ? parsed.data.role
      : 'buyer'

    await supabase
      .from('profiles')
      .update({ full_name: parsed.data.fullName, role: safeRole as 'buyer' | 'business_client' })
      .eq('id', data.user.id)
  }

  redirect('/verify-email')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = createClient()

  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient()

  const parsed = resetConfirmSchema.safeParse({
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/login')
}
