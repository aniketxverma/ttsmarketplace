import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { RoleChanger } from './RoleChanger'

const ROLES = ['all', 'buyer', 'business_client', 'supplier', 'broker', 'admin']

const ROLE_COLORS: Record<string, string> = {
  admin:           'bg-red-100 text-red-700',
  supplier:        'bg-blue-100 text-blue-700',
  broker:          'bg-purple-100 text-purple-700',
  business_client: 'bg-amber-100 text-amber-700',
  buyer:           'bg-green-100 text-green-700',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string }
}) {
  await requireRole('admin')
  const supabase = createClient()

  const selectedRole = searchParams.role ?? 'all'

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, phone, created_at')
    .order('created_at', { ascending: false })

  if (selectedRole !== 'all') {
    query = query.eq('role', selectedRole)
  }

  const { data: users } = await query

  // Count per role
  const counts: Record<string, number> = {}
  for (const r of ['buyer', 'business_client', 'supplier', 'broker', 'admin']) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', r)
    counts[r] = count ?? 0
  }
  counts['all'] = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{counts['all']} registered accounts</p>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((r) => {
          const isActive = r === selectedRole
          return (
            <a
              key={r}
              href={r === 'all' ? '/admin/users' : `/admin/users?role=${r}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                isActive ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
              }`}
            >
              {r === 'business_client' ? 'Business' : r.charAt(0).toUpperCase() + r.slice(1)}
              <span className="ml-1.5 opacity-70">{counts[r] ?? 0}</span>
            </a>
          )
        })}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Phone</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.full_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 12)}…</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <RoleChanger userId={u.id} currentRole={u.role} />
                </td>
              </tr>
            ))}
            {!users?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
