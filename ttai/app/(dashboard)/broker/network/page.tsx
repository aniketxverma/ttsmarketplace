import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { ReferForm } from '@/components/broker/ReferForm'
import { Building2, Users, MapPin, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BrokerNetworkPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: broker } = await supabase.from('brokers').select('id, legal_name').eq('user_id', user.id).single()
  if (!broker) redirect('/broker/register')

  let refs: any[] = []
  try {
    const { data } = await (createAdminClient().from('broker_referrals') as any)
      .select('*').eq('broker_id', broker.id).order('created_at', { ascending: false }).limit(200)
    refs = data ?? []
  } catch { refs = [] }

  const suppliers = refs.filter((r) => r.company_type === 'supplier')
  const buyers = refs.filter((r) => r.company_type === 'buyer')

  const Card = ({ r }: { r: any }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <div className="flex items-center justify-between">
        <p className="font-bold text-gray-900 text-sm">{r.company_name}</p>
        <span className="text-[10px] font-bold text-green-600">+{r.points} pts</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400 mt-1">
        {r.category && <span>{r.category}</span>}
        {r.country_name && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.country_name}</span>}
        {r.contact_email && <span className="inline-flex items-center gap-0.5"><Mail className="w-3 h-3" />{r.contact_email}</span>}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">My Network</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your protected network of registered suppliers and buyers.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-6">
          <section>
            <h2 className="font-extrabold text-[#0B1F4D] flex items-center gap-2 mb-3"><Building2 className="w-4 h-4" /> Suppliers <span className="text-gray-400 font-normal">({suppliers.length})</span></h2>
            {suppliers.length ? <div className="grid sm:grid-cols-2 gap-3">{suppliers.map((r) => <Card key={r.id} r={r} />)}</div>
              : <p className="text-sm text-gray-400">No supplier references yet.</p>}
          </section>
          <section>
            <h2 className="font-extrabold text-[#0B1F4D] flex items-center gap-2 mb-3"><Users className="w-4 h-4" /> Buyers <span className="text-gray-400 font-normal">({buyers.length})</span></h2>
            {buyers.length ? <div className="grid sm:grid-cols-2 gap-3">{buyers.map((r) => <Card key={r.id} r={r} />)}</div>
              : <p className="text-sm text-gray-400">No buyer references yet.</p>}
          </section>
        </div>
        <div className="lg:sticky lg:top-20"><ReferForm /></div>
      </div>
    </div>
  )
}
