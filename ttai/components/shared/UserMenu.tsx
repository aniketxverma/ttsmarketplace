'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserRole } from '@/types/domain'

interface UserMenuProps {
  fullName: string | null
  email: string
  role: UserRole
}

const ROLE_LINKS: Record<UserRole, { label: string; href: string }[]> = {
  admin:           [{ label: 'Admin Panel',        href: '/admin' }],
  supplier:        [{ label: 'Supplier Dashboard', href: '/supplier' }],
  broker:          [{ label: 'Broker Dashboard',   href: '/broker' }],
  buyer:           [{ label: 'My Orders',          href: '/buyer/orders' }],
  business_client: [{ label: 'My Orders',          href: '/buyer/orders' }],
}

export function UserMenu({ fullName, email, role }: UserMenuProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = ROLE_LINKS[role] ?? []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {(fullName ?? email)[0].toUpperCase()}
          </div>
          <span className="hidden sm:block max-w-[120px] truncate">{fullName ?? email}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{fullName ?? 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((l) => (
          <DropdownMenuItem key={l.href} asChild>
            <Link href={l.href}>{l.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
