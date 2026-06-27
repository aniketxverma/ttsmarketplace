import type { ReactNode } from 'react'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { ControlCenterForm } from '@/components/shared/ControlCenterForm'
import { departmentInfo, type Department } from '@/lib/control-center'

export type Service = { icon: ReactNode; title: string; desc: string }
export type Step = { title: string; desc: string }

/**
 * Shared marketing landing for a TTAIEMA department (Logistics, Consulting…).
 * Hero → services → how it works → an embedded Control Center form that routes
 * straight to that department's manager.
 */
export async function DepartmentLanding({
  department, kicker, title, subtitle, heroBlurb, services, steps, formTitle, sourceForm,
}: {
  department: Department
  kicker: string
  title: string
  subtitle: string
  heroBlurb: string
  services: Service[]
  steps: Step[]
  formTitle: string
  sourceForm: string
}) {
  
  const tt = await localizeUI(["Request a quote", "Managed by", "What we handle", "End-to-end support from our", "team.", "How it works", "Send your request and", "from our", "team will get back to you."], getLocale())
  const dept = departmentInfo(department)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] text-white">
        <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-[#F5A623]/15 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 max-w-5xl py-16 sm:py-20 relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#F5A623] mb-4">{kicker}</span>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight max-w-3xl">{title}</h1>
          <p className="text-blue-100/85 mt-4 text-base sm:text-lg max-w-2xl">{subtitle}</p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <a href="#request" className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors">
              {tt("Request a quote")}
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-5 py-3 text-sm font-bold">
              <span className="w-6 h-6 rounded-full bg-[#F5A623] text-[#0B1F4D] flex items-center justify-center text-[11px] font-black">{dept.manager[0]}</span>
              {tt("Managed by")} {dept.manager}
            </span>
          </div>
        </div>
      </section>

      {/* Intro blurb */}
      <div className="container mx-auto px-4 max-w-5xl -mt-8 relative">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-7">
          <p className="text-gray-600 leading-relaxed">{heroBlurb}</p>
        </div>
      </div>

      {/* Services */}
      <section className="container mx-auto px-4 max-w-5xl py-12">
        <h2 className="text-2xl font-extrabold text-[#0B1F4D]">{tt("What we handle")}</h2>
        <p className="text-gray-500 text-sm mt-1">{tt("End-to-end support from our")} {dept.label} {tt("team.")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="w-11 h-11 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center text-[#0B1F4D] mb-3">{s.icon}</span>
              <p className="font-extrabold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 max-w-5xl py-12">
          <h2 className="text-2xl font-extrabold text-[#0B1F4D]">{tt("How it works")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {steps.map((st, i) => (
              <div key={st.title} className="relative rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <span className="absolute -top-3 -left-2 w-9 h-9 rounded-xl bg-[#F5A623] text-[#0B1F4D] flex items-center justify-center font-black shadow">{i + 1}</span>
                <p className="font-extrabold text-gray-900 mt-3">{st.title}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request form (routes into the Control Center → assigned to the manager) */}
      <section id="request" className="container mx-auto px-4 max-w-3xl py-14 scroll-mt-20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-[#0B1F4D]">{formTitle}</h2>
          <p className="text-gray-500 text-sm mt-1">{tt("Send your request and")} {dept.manager} {tt("from our")} {dept.label} {tt("team will get back to you.")}</p>
        </div>
        <ControlCenterForm defaultDepartment={department} sourceForm={sourceForm} />
      </section>
    </div>
  )
}
