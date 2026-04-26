import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'

export async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            TTAI
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <Link href="/store" className="text-muted-foreground hover:text-foreground transition-colors">
              Store
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user && profile ? (
            <UserMenu
              fullName={profile.full_name}
              email={user.email ?? ''}
              role={profile.role as import('@/types/domain').UserRole}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
