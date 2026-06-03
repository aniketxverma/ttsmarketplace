'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Login renders its own full-screen split layout
  if (pathname === '/login') return <>{children}</>

  const isRegister = pathname === '/register'

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-br from-[#0B1F4D]/5 via-white to-[#F5A623]/5">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#0B1F4D]/[0.05] blur-2xl animate-float" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#F5A623]/[0.07] blur-2xl animate-float delay-400" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#0B1F4D 1px,transparent 1px),linear-gradient(90deg,#0B1F4D 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      {/* Brand header */}
      <Link href="/" className="relative z-10 inline-flex items-center gap-2.5 mb-7 animate-fade-in-up">
        <div className="w-9 h-9 rounded-xl bg-[#0B1F4D] flex items-center justify-center shadow-md">
          <ShoppingBag className="w-5 h-5 text-[#F5A623]" />
        </div>
        <span className="text-xl font-black tracking-tight text-[#0B1F4D]">
          TTAI <span className="text-[#F5A623]">EMA</span>
        </span>
      </Link>

      <div className={`relative z-10 w-full ${isRegister ? 'max-w-2xl' : 'max-w-lg'}`}>
        {children}
      </div>
    </div>
  )
}
