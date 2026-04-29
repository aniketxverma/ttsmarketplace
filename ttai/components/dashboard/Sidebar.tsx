'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/domain'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const SUPPLIER_NAV: NavItem[] = [
  { label: 'Dashboard',  href: '/supplier',           icon: <GridIcon /> },
  { label: 'Products',   href: '/supplier/products',  icon: <BoxIcon /> },
  { label: 'Orders',     href: '/supplier/orders',    icon: <OrderIcon /> },
  { label: 'Messages',   href: '/supplier/messages',  icon: <ChatIcon /> },
  { label: 'Documents',  href: '/supplier/documents', icon: <DocIcon /> },
  { label: 'Settings',   href: '/supplier/settings',  icon: <SettingsIcon /> },
]

const BROKER_NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/broker',             icon: <GridIcon /> },
  { label: 'Suppliers',   href: '/broker/suppliers',   icon: <BoxIcon /> },
  { label: 'Promotions',  href: '/broker/promotions',  icon: <StarIcon /> },
  { label: 'Invoices',    href: '/broker/invoices',    icon: <DocIcon /> },
  { label: 'Payouts',     href: '/broker/payouts',     icon: <MoneyIcon /> },
  { label: 'Settings',    href: '/broker/settings',    icon: <SettingsIcon /> },
]

const BUYER_NAV: NavItem[] = [
  { label: 'Dashboard',  href: '/buyer',              icon: <GridIcon /> },
  { label: 'Orders',     href: '/buyer/orders',       icon: <OrderIcon /> },
  { label: 'Messages',   href: '/buyer/messages',     icon: <ChatIcon /> },
  { label: 'Settings',   href: '/buyer/settings',     icon: <SettingsIcon /> },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/admin',              icon: <GridIcon /> },
  { label: 'Suppliers',    href: '/admin/suppliers',    icon: <BoxIcon /> },
  { label: 'Brokers',      href: '/admin/brokers',      icon: <StarIcon /> },
  { label: 'Transactions', href: '/admin/transactions', icon: <MoneyIcon /> },
  { label: 'Audit Log',    href: '/admin/audit-log',    icon: <DocIcon /> },
]

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  supplier:        SUPPLIER_NAV,
  broker:          BROKER_NAV,
  buyer:           BUYER_NAV,
  business_client: BUYER_NAV,
  admin:           ADMIN_NAV,
}

function isActive(pathname: string, href: string) {
  if (href.split('/').length === 2) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export function Sidebar({ role, className }: { role: UserRole; className?: string }) {
  const pathname = usePathname()
  const items = NAV_BY_ROLE[role] ?? BUYER_NAV

  return (
    <aside className={className ?? 'w-56 flex-shrink-0 border-r bg-muted/30 min-h-[calc(100vh-4rem)]'}>
      <nav className="p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors',
              isActive(pathname, item.href) && 'bg-accent font-medium text-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function GridIcon()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> }
function BoxIcon()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> }
function OrderIcon()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> }
function DocIcon()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> }
function SettingsIcon(){ return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function StarIcon()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> }
function MoneyIcon()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function ChatIcon()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> }
