import type { ReactNode } from 'react'

export const COMPANY = {
  legal: 'FULL SOFTRONIC S.L.',
  cif: 'B52038130',
  address: 'Calle Sor Alegría, 4 - Local 1, 52002 Melilla, Spain',
  email: 'info@ttaiema.com',
  sites: ['www.ttaiema.com', 'www.ttaiz.com'],
}

export function LegalShell({ title, subtitle, updated, children }: { title: string; subtitle?: string; updated?: string; children: ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1e3a8a] text-white">
        <div className="container mx-auto px-4 max-w-3xl py-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{title}</h1>
          {subtitle && <p className="text-blue-200 mt-2 text-sm sm:text-base">{subtitle}</p>}
          {updated && <p className="text-xs text-blue-300/80 mt-3">Last updated: {updated}</p>}
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-3xl py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sm:p-10 space-y-7 text-[15px] text-gray-700 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-extrabold text-[#0B1F4D]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
