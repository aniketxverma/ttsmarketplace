import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ChatThread } from '@/components/messages/ChatThread'

export default async function BuyerChatPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const supabase = createClient()

  // Verify this buyer owns the conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, subject, order_id, supplier_id, suppliers!supplier_id(legal_name, trade_name)')
    .eq('id', params.id)
    .eq('buyer_id', user.id)
    .single()

  if (!conv) notFound()

  const s = conv.suppliers as { legal_name: string; trade_name: string | null } | null
  const supplierName = s?.trade_name ?? s?.legal_name ?? 'Supplier'

  // Load initial messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, body, sender_id, is_read, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/buyer/messages"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B1F4D] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Messages
        </Link>
        {conv.order_id && (
          <>
            <span className="text-gray-300">/</span>
            <Link
              href={`/buyer/orders/${conv.order_id}`}
              className="text-sm text-gray-500 hover:text-[#0B1F4D] transition-colors"
            >
              View Order
            </Link>
          </>
        )}
      </div>

      <ChatThread
        conversationId={conv.id}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        otherPartyName={supplierName}
      />
    </div>
  )
}
