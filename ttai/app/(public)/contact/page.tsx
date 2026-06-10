import { COMPANY } from '@/components/legal/LegalShell'
import { Mail, MapPin, Building2, Globe } from 'lucide-react'

export const metadata = { title: 'Contact · TTAI EMA', description: 'Get in touch with the TTAI EMA team.' }

export default function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1e3a8a] text-white">
        <div className="container mx-auto px-4 max-w-3xl py-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Contact us</h1>
          <p className="text-blue-200 mt-2 text-sm sm:text-base">We&rsquo;re here to help suppliers, buyers and partners. Reach out any time.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10 grid gap-5 sm:grid-cols-2">
        <a href={`mailto:${COMPANY.email}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#0B1F4D]/20 transition-all">
          <Mail className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">Email</h2>
          <p className="text-sm text-gray-600 mt-1 group-hover:text-[#2563eb] transition-colors">{COMPANY.email}</p>
        </a>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <MapPin className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">Head Office</h2>
          <p className="text-sm text-gray-600 mt-1">{COMPANY.address}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Building2 className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">Company</h2>
          <p className="text-sm text-gray-600 mt-1">{COMPANY.legal}</p>
          <p className="text-sm text-gray-500">CIF: {COMPANY.cif}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Globe className="w-7 h-7 text-[#F5A623]" />
          <h2 className="mt-3 font-bold text-[#0B1F4D]">Online</h2>
          {COMPANY.sites.map((s) => (
            <p key={s} className="text-sm mt-1">
              <a href={`https://${s}`} className="text-gray-600 hover:text-[#2563eb] transition-colors">{s}</a>
            </p>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl pb-14">
        <div className="bg-[#0B1F4D] rounded-2xl p-7 sm:p-9 text-center text-white">
          <h2 className="text-xl font-extrabold">Looking to sell or source on TTAI?</h2>
          <p className="text-blue-200 text-sm mt-2 max-w-md mx-auto">Email us your business details and our team will help you get set up as a supplier, distributor or sales point.</p>
          <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center justify-center mt-5 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors">
            Email {COMPANY.email}
          </a>
        </div>
      </div>
    </div>
  )
}
