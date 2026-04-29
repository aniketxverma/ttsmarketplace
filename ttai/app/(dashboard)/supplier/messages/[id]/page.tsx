import { notFound, redirect } from 'next/navigation'
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

  const { data: conv } = await (supabase as any)
    .from('conversations')
    .select('id, subject, order_id, buyer_id, profiles!buyer_id(full_name)')
    .eq('id', params.id)
    .eq('supplier_id', supplier.id)
    .single()

  if (!conv) notFound()

  const buyer = (conv as any).profiles as { full_name: string | null } | null
  const buyerName = buyer?.full_name ?? 'Buyer'

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
        otherPartyName={buyerName}
        backHref="/supplier/messages"
        backLabel="Your Messages"
        orderHref={(conv as any).order_id ? `/supplier/orders/${(conv as any).order_id}` : undefined}
      />
    </div>
  )
}
