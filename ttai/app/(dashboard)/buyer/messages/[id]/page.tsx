import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ChatThread } from '@/components/messages/ChatThread'

export default async function BuyerChatPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: conv } = await (supabase as any)
    .from('conversations')
    .select('id, subject, order_id, supplier_id, suppliers!supplier_id(legal_name, trade_name)')
    .eq('id', params.id)
    .eq('buyer_id', user.id)
    .single()

  if (!conv) notFound()

  const s = (conv as any).suppliers as { legal_name: string; trade_name: string | null } | null
  const supplierName = s?.trade_name ?? s?.legal_name ?? 'Supplier'

  const { data: messages } = await (supabase as any)
    .from('messages')
    .select('id, body, sender_id, is_read, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <div className="-m-4 lg:m-0">
      <ChatThread
        conversationId={(conv as any).id}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        otherPartyName={supplierName}
        backHref="/buyer/messages"
        backLabel="Your Messages"
        orderHref={(conv as any).order_id ? `/buyer/orders/${(conv as any).order_id}` : undefined}
      />
    </div>
  )
}
