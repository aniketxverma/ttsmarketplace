const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

// 👇 ensure profile exists + fix type issue
if (!profile) {
  redirect('/buyer')
}

const dest = redirectParam ?? (() => {
  switch (profile.role) {
    case 'admin':    return '/admin'
    case 'supplier': return '/supplier'
    case 'broker':   return '/broker'
    default:         return '/buyer'
  }
})()