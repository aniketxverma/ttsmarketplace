import { notFound } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Users, Calendar, Globe, BarChart3, Handshake, ChevronRight } from 'lucide-react'
import { getProject, PROJECTS, TYPE_STYLES, STATUS_STYLES, type ProjectType } from '@/lib/projects-data'

const TYPE_ICONS: Record<ProjectType, typeof BarChart3> = {
  Investment:   BarChart3,
  Distribution: Globe,
  Partnership:  Handshake,
}

export async function generateStaticParams() {
  return PROJECTS.map(p => ({ id: p.id }))
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const project = getProject(params.id)
  if (!project) return {}
  return {
    title: `${project.title} · TTAI Projects`,
    description: project.description,
  }
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  
  const tt = await localizeUI(["All Projects", "Overview", "What You Get", "Requirements", "Regions Covered", "Project Details", "Investment", "Timeline", "Category", "Slots Available", "left", "slots filled", "Express Interest", "Express Interest via WhatsApp", "Create Free Account", "Other Projects"], getLocale())
  const project = getProject(params.id)
  if (!project) notFound()

  const typeStyle   = TYPE_STYLES[project.type]
  const statusStyle = STATUS_STYLES[project.status]
  const TypeIcon    = TYPE_ICONS[project.type]
  const pct         = Math.round((project.slots_filled / project.slots_total) * 100)
  const slotsLeft   = project.slots_total - project.slots_filled
  const waHref      = `https://wa.me/34600000000?text=${encodeURIComponent(project.wa_message)}`

  return (
    <div className="min-h-screen bg-[#F4F6FB]">

      {/* ── Header banner ─────────────────────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${project.gradient} overflow-hidden`}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <Link href="/projects"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />{tt("All Projects")}
          </Link>

          <div className="flex items-start gap-5">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl bg-white/10 border border-white/20 shrink-0 shadow-lg`}>
              {project.icon}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white`}>
                  <TypeIcon className="w-3 h-3" />{project.type}
                </span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${statusStyle}`}>
                  {project.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-1">{project.title}</h1>
              <p className="text-white/60 text-base">{project.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-widest mb-4">{tt("Overview")}</h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {project.longDescription}
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-widest mb-4">{tt("What You Get")}</h2>
              <div className="space-y-3">
                {project.highlights.map(h => (
                  <div key={h} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-widest mb-4">{tt("Requirements")}</h2>
              <div className="space-y-3">
                {project.requirements.map(r => (
                  <div key={r} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0B1F4D] mt-2 shrink-0" />
                    <p className="text-gray-700 text-sm leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-widest mb-4">{tt("Regions Covered")}</h2>
              <div className="flex flex-wrap gap-2">
                {project.regions.map(r => (
                  <span key={r} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F4D]/6 text-[#0B1F4D] text-sm font-semibold">
                    <Globe className="w-3 h-3 opacity-60" />{r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Project summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">{tt("Project Details")}</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-extrabold mb-0.5">{tt("Investment")}</p>
                  <p className="text-sm font-extrabold text-[#0B1F4D]">{project.investment_range}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-extrabold mb-0.5">{tt("Timeline")}</p>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />{project.timeline}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-extrabold mb-0.5">{tt("Category")}</p>
                  <p className="text-sm font-semibold text-gray-700">{project.category}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-extrabold flex items-center gap-1">
                      <Users className="w-3 h-3" />{tt("Slots Available")}
                    </p>
                    <p className="text-xs font-extrabold text-[#0B1F4D]">{slotsLeft} {tt("left")}</p>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-red-400' : pct >= 50 ? 'bg-amber-400' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{project.slots_filled} of {project.slots_total} {tt("slots filled")}</p>
                </div>
              </div>
            </div>

            {/* Express Interest CTA */}
            <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3580] rounded-2xl p-5 text-white shadow-lg">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center text-xl mb-3 shadow-md`}>
                {project.icon}
              </div>
              <p className="font-extrabold text-base mb-1">{tt("Express Interest")}</p>
              <p className="text-blue-200 text-xs mb-4 leading-relaxed">
                Reach out to the TTAI team directly. We'll send you a full project dossier and schedule a call.
              </p>

              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] text-white py-3 text-sm font-extrabold hover:bg-[#1ebe5d] transition-colors shadow-sm mb-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {tt("Express Interest via WhatsApp")}
              </a>

              <Link href="/register"
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-white/10 border border-white/20 text-white py-2.5 text-sm font-bold hover:bg-white/20 transition-colors">
                {tt("Create Free Account")} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Other projects */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">{tt("Other Projects")}</p>
              <div className="space-y-3">
                {PROJECTS.filter(p => p.id !== project.id).slice(0, 3).map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className="flex items-center gap-3 group">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-sm shrink-0`}>
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-gray-800 truncate group-hover:text-[#0B1F4D] transition-colors">{p.title}</p>
                      <p className="text-[10px] text-gray-400">{p.type} · {p.status}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
