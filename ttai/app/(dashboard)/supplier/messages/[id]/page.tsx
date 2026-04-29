import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ChatThread } from '@/components/messages/ChatThread'

export default async function SupplierChatPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')

  // Verify this supplier owns the conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, subject, order_id, buyer_id, profiles!buyer_id(full_name)')
    .eq('id', params.id)
    .eq('supplier_id', supplier.id)
    .single()

  if (!conv) notFound()

  const buyer = conv.profiles as { full_name: string | null } | null
  const buyerName = buyer?.full_name ?? 'Buyer'

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
          href="/supplier/messages"
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
              href={`/supplier/orders/${conv.order_id}`}
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
        otherPartyName={buyerName}
      />
    </div>
  )
}
