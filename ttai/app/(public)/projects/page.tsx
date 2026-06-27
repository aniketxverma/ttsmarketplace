import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { ArrowRight, TrendingUp, Globe, Handshake, BarChart3, Users, Zap } from 'lucide-react'
import { PROJECTS, TYPE_STYLES, STATUS_STYLES, type ProjectType } from '@/lib/projects-data'

export const metadata = {
  title: 'Trade Projects & Partnerships · TTAI EMA',
  description: 'Join exclusive trade projects, co-invest in distribution packs, or partner with TTAI EMA for joint ventures across Europe and Africa.',
}

const TYPE_ICONS: Record<ProjectType, typeof TrendingUp> = {
  Investment:   BarChart3,
  Distribution: Globe,
  Partnership:  Handshake,
}

export default async function ProjectsPage() {
  
  const tt = await localizeUI(["Invest. Partner.", "Scale Together.", "Browse Projects", "Create Free Account", "Live Opportunities", "open", "Investment", "Timeline", "Regions", "slots filled", "View Details", "Don't see the right project?", "Discuss on WhatsApp"], getLocale())
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0B1F4D] via-[#0d2660] to-[#162d6b] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#F5A623]/10" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white/[0.03]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#F5A623]/20 border border-[#F5A623]/30 text-[#F5A623] text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3 h-3" />Trade Projects · Live Opportunities
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
              {tt("Invest. Partner.")}<br />
              <span className="text-[#F5A623]">{tt("Scale Together.")}</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl">
              Join exclusive trade projects coordinated by TTAI EMA — distribution packs, co-investment opportunities, and broker partnerships across Europe and Africa.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#projects"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] text-[#0B1F4D] rounded-xl font-extrabold text-sm hover:bg-[#fbb93a] transition-colors shadow-lg">
                {tt("Browse Projects")} <ArrowRight className="w-4 h-4" />
              </a>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
                {tt("Create Free Account")}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { value: '5', label: 'Active Projects' },
                { value: '12+', label: 'Countries Covered' },
                { value: '€500K+', label: 'Total Deal Value' },
                { value: '40+', label: 'Partners Joined' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-white">{value}</p>
                  <p className="text-xs text-white/50 mt-0.5 font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Project types ───────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {([
            { type: 'Investment' as ProjectType,   Icon: BarChart3,  desc: 'Co-invest in private label manufacturing, warehousing, or trade infrastructure.' },
            { type: 'Distribution' as ProjectType, Icon: Globe,      desc: 'Join group sourcing or co-distribution networks to access better pricing and reach.' },
            { type: 'Partnership' as ProjectType,  Icon: Handshake,  desc: 'Become a regional TTAI broker or supply chain partner in high-growth markets.' },
          ] as const).map(({ type, Icon, desc }) => {
            const styles = TYPE_STYLES[type]
            return (
              <div key={type} className="bg-[#F4F6FB] rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold mb-3 ${styles.badge}`}>
                  <Icon className="w-3 h-3" />{type}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Projects list ────────────────────────────────────────────────── */}
      <div id="projects" className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-[#0B1F4D]">{tt("Live Opportunities")}</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-500">{PROJECTS.filter(p => p.status !== 'Closed').length} {tt("open")}</span>
          </div>
        </div>

        <div className="space-y-5">
          {PROJECTS.map(project => {
            const typeStyle   = TYPE_STYLES[project.type]
            const statusStyle = STATUS_STYLES[project.status]
            const TypeIcon    = TYPE_ICONS[project.type]
            const pct         = Math.round((project.slots_filled / project.slots_total) * 100)

            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="group block bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${typeStyle.bar.replace('bg-', 'from-')} to-transparent`}
                  style={{ background: `linear-gradient(90deg, var(--tw-gradient-stops))` }}>
                  <div className={`h-full ${typeStyle.bar}`} />
                </div>

                <div className="p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br ${project.gradient} shadow-md`}>
                      {project.icon}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${typeStyle.badge}`}>
                          <TypeIcon className="w-2.5 h-2.5" />{project.type}
                        </span>
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${statusStyle}`}>
                          {project.status}
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">{project.category}</span>
                      </div>

                      <h3 className="text-xl font-extrabold text-[#0B1F4D] mb-1 group-hover:text-[#1a3580] transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-2xl">{project.description}</p>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs font-semibold">{tt("Investment")}</span>
                          <p className="font-extrabold text-[#0B1F4D] text-sm">{project.investment_range}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs font-semibold">{tt("Timeline")}</span>
                          <p className="font-extrabold text-[#0B1F4D] text-sm">{project.timeline}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs font-semibold">{tt("Regions")}</span>
                          <p className="font-semibold text-gray-700 text-sm">{project.regions.slice(0, 3).join(', ')}{project.regions.length > 3 ? ` +${project.regions.length - 3}` : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Slots + CTA */}
                    <div className="shrink-0 sm:text-right">
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 font-semibold mb-1">
                          <Users className="w-3 h-3 inline mr-1" />{project.slots_filled}/{project.slots_total} {tt("slots filled")}
                        </p>
                        <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 80 ? 'bg-red-400' : pct >= 50 ? 'bg-amber-400' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F4D] text-white rounded-xl text-xs font-extrabold group-hover:bg-[#162d6e] transition-colors">
                        {tt("View Details")} <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3580] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">{tt("Don't see the right project?")}</h2>
          <p className="text-white/60 text-base mb-8 leading-relaxed">
            Contact the TTAI team to discuss custom partnerships, joint ventures, or new project ideas.
          </p>
          <a href="https://wa.me/34600000000?text=Hi TTAI, I'd like to discuss a trade project or partnership opportunity."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#25D366] text-white rounded-xl font-extrabold text-sm hover:bg-[#1ebe5d] transition-colors shadow-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {tt("Discuss on WhatsApp")}
          </a>
        </div>
      </div>
    </div>
  )
}
