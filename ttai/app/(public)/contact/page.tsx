import { COMPANY } from '@/components/legal/LegalShell'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { Mail, MapPin, Building2, Globe } from 'lucide-react'
import { ControlCenterForm } from '@/components/shared/ControlCenterForm'

export const metadata = { title: 'Contact · TTAI EMA', description: 'Get in touch with the TTAI EMA team.' }

const VALID = ['marketplace', 'logistics', 'consulting'] as const
type Dept = typeof VALID[number]

// A ?topic= on the contact link pre-fills the Subject so the inquiry is identifiable.
const TOPIC_SUBJECT: Record<string, string> = {
  'distribution-network': 'TTAIEMA Official Distribution Network — Request a Private Presentation',
}

export default async function ContactPage({ searchParams }: { searchParams: { dept?: string; topic?: string } }) {

  const subjectEn = TOPIC_SUBJECT[searchParams.topic ?? ''] ?? ''
  const tt = await localizeUI(["Contact us", "Email", "Head Office", "Company", "Online", ...(subjectEn ? [subjectEn] : [])], getLocale())
  const dept: Dept = (VALID.includes(searchParams.dept as Dept) ? searchParams.dept : 'marketplace') as Dept
  const defaultSubject = subjectEn ? tt(subjectEn) : ''
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1e3a8a] text-white">
        <div className="container mx-auto px-4 max-w-3xl py-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{tt("Contact us")}</h1>
          <p className="text-blue-200 mt-2 text-sm sm:text-base">We&rsquo;re here to help suppliers, buyers and partners. Reach out any time.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10 grid gap-5 sm:grid-cols-2">
        <a href={`mailto:${COMPANY.email}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#0B1F4D]/20 transition-all">
          <Mail className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">{tt("Email")}</h2>
          <p className="text-sm text-gray-600 mt-1 group-hover:text-[#2563eb] transition-colors">{COMPANY.email}</p>
        </a>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <MapPin className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">{tt("Head Office")}</h2>
          <p className="text-sm text-gray-600 mt-1">{COMPANY.address}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Building2 className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">{tt("Company")}</h2>
          <p className="text-sm text-gray-600 mt-1">{COMPANY.legal}</p>
          <p className="text-sm text-gray-500">CIF: {COMPANY.cif}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Globe className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">{tt("Online")}</h2>
          {COMPANY.sites.map((s) => (
            <p key={s} className="text-sm mt-1">
              <a href={`https://${s}`} className="text-gray-600 hover:text-[#2563eb] transition-colors">{s}</a>
            </p>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl pb-14">
        <ControlCenterForm defaultDepartment={dept} defaultSubject={defaultSubject} />
      </div>
    </div>
  )
}
