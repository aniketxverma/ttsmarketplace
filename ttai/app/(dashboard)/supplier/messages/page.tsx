import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'

export default async function SupplierMessagesPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, subject, last_message_at, order_id, profiles!buyer_id(full_name)')
    .eq('supplier_id', supplier.id)
    .order('last_message_at', { ascending: false })

  const convIds = (conversations ?? []).map((c) => c.id)
  const unreadMap: Record<string, number> = {}
  if (convIds.length > 0) {
    const { data: unread } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .eq('is_read', false)
    for (const m of unread ?? []) {
      unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1
    }
  }

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F4D]">Messages</h1>
          {totalUnread > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {!conversations?.length ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-600">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1">Buyers will message you from your supplier profile</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const buyer = c.profiles as { full_name: string | null } | null
            const name = buyer?.full_name ?? 'Buyer'
            const unread = unreadMap[c.id] ?? 0
            const timeAgo = new Date(c.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })

            return (
              <Link
                key={c.id}
                href={`/supplier/messages/${c.id}`}
                className={`flex items-center gap-4 rounded-2xl border bg-white hover:shadow-sm transition-all p-4 ${unread > 0 ? 'border-[#0B1F4D]/20 bg-blue-50/30' : 'border-gray-100'}`}
              >
                <div className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                  {name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {name}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {c.subject ?? (c.order_id ? 'Order discussion' : 'General inquiry')}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
