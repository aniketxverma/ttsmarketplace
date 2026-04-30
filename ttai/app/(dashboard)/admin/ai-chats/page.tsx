import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { ChatSessionList } from './ChatSessionList'

export const revalidate = 30

export default async function AdminAiChatsPage() {
  await requireRole('admin')

  const supabase = createAdminClient()

  // Fetch recent messages — group by session client-side
  const { data: messages } = await (supabase.from('ai_chats' as any) as any)
    .select('id, session_key, user_id, role, content, products, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  const rows = (messages ?? []) as {
    id: string
    session_key: string
    user_id: string | null
    role: 'user' | 'assistant'
    content: string
    products: any[]
    created_at: string
  }[]

  // Collect unique user_ids
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[]
  let profileMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await (supabase.from('profiles' as any) as any)
      .select('id, full_name')
      .in('id', userIds)
    ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p.full_name ?? 'Unknown' })
  }

  // Group by session_key (preserving order of first appearance = most recent)
  const sessionMap = new Map<string, typeof rows>()
  for (const row of rows) {
    if (!sessionMap.has(row.session_key)) sessionMap.set(row.session_key, [])
    sessionMap.get(row.session_key)!.push(row)
  }

  const sessions = Array.from(sessionMap.entries()).map(([key, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const userId = msgs.find((m) => m.user_id)?.user_id ?? null
    const firstUser = sorted.find((m) => m.role === 'user')
    return {
      key,
      userId,
      userName: userId ? (profileMap[userId] ?? 'Unknown') : 'Anonymous',
      messageCount: msgs.length,
      userCount: msgs.filter((m) => m.role === 'user').length,
      firstQuery: firstUser?.content ?? '—',
      startedAt: sorted[0]?.created_at ?? '',
      lastAt: sorted[sorted.length - 1]?.created_at ?? '',
      messages: sorted,
    }
  })

  const totalSessions = sessions.length
  const totalMessages = rows.length
  const loggedInSessions = sessions.filter((s) => s.userId).length

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">AI Chat History</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {totalSessions} sessions · {totalMessages} messages · {loggedInSessions} from logged-in users
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: totalSessions, color: 'text-blue-600' },
          { label: 'Total Messages', value: totalMessages, color: 'text-purple-600' },
          { label: 'Logged-in Users', value: loggedInSessions, color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4 text-center">
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {sessions.length > 0 ? (
        <ChatSessionList sessions={sessions} />
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-muted-foreground">
          No AI chats yet. They appear here after users interact with the chat widget.
        </div>
      )}
    </div>
  )
}
