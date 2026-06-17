import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Resolve the OpenAI key: prefer the admin-managed key in app_settings
// (translation_openai_key) — the same working key the Translations page uses —
// then fall back to the env var.
async function getOpenAIKey(): Promise<string | undefined> {
  try {
    const admin = createAdminClient()
    const { data } = await (admin.from('app_settings') as any).select('value').eq('key', 'translation_openai_key').maybeSingle()
    if (data?.value) return data.value as string
  } catch { /* fall through */ }
  return process.env.OPENAI_API_KEY
}

const SYSTEM_PROMPT = `You are TTAI Assistant — the AI shopping guide for TTAI EMA Marketplace, a global B2B and B2C trade platform with verified suppliers from the Middle East, Europe, Asia, Africa, and the Americas.

Your capabilities:
- Search for products by keywords, category, or price using search_products
- Look up supplier information using get_supplier_info
- Contact a supplier on behalf of the user using contact_supplier (only when user explicitly asks to message/contact a supplier)
- Help users discover products, compare prices, and navigate the marketplace

Guidelines:
- Be friendly, concise, and helpful — keep responses under 3 sentences plus results
- Always search for products when the user asks about anything product-related
- When showing products, briefly describe why they match the user's need
- For contact_supplier: only use it when the user explicitly says "contact", "message", "reach out to", or "send message to" a supplier
- If the user is not logged in and tries to contact a supplier, tell them to log in first
- Never mention "GPT", "OpenAI", or "language model" — you are TTAI Assistant
- Suggest related products or categories when helpful
- Use emojis sparingly for warmth`

export interface ChatProduct {
  id: string
  name: string
  slug: string
  price_cents: number
  currency_code: string
  category_name: string | null
  image_url: string | null
}

export interface ChatAction {
  type: 'message_sent'
  supplier_name: string
  conversation_url: string
}

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products in the TTAI marketplace by keywords, category, or price',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords (product name, material, use case)' },
          category_slug: { type: 'string', description: 'Category filter: agriculture-food, electronics-technology, textiles-apparel, construction-materials, health-beauty, home-garden, automotive-transport, industrial-machinery, sports-leisure, office-stationery' },
          max_price_eur: { type: 'number', description: 'Max price in EUR' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_supplier_info',
      description: 'Look up information about a specific supplier by name',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Supplier trade name or legal name to search for' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'contact_supplier',
      description: 'Send a message to a supplier on behalf of the logged-in user. Only call this when the user explicitly asks to contact or message a supplier.',
      parameters: {
        type: 'object',
        properties: {
          supplier_name: { type: 'string', description: 'Name of the supplier to contact' },
          message: { type: 'string', description: 'The message to send to the supplier' },
        },
        required: ['supplier_name', 'message'],
      },
    },
  },
]

// Synonyms so natural queries hit the catalogue (e.g. "apple devices" → iphone).
const SEARCH_ALIASES: Record<string, string[]> = {
  apple: ['iphone', 'ipad', 'macbook', 'airpods', 'apple'],
  phone: ['iphone', 'samsung', 'smartphone', 'galaxy'],
  laptop: ['notebook', 'macbook', 'laptop'],
  headphone: ['headphone', 'airpods', 'earbuds', 'jbl', 'cuffie'],
  speaker: ['speaker', 'altoparlanti', 'jbl'],
  tv: ['tv', 'led', 'television', 'pollici'],
  watch: ['watch', 'wearable', 'smartwatch'],
  cleaning: ['rozil', 'detergent', 'cleaner', 'limpiahogar'],
  oil: ['oil', 'viscosity', 'lubricant', 'engine'],
  food: ['hummus', 'chtaura', 'olive', 'tahini', 'pickle'],
}

async function searchProducts(query: string, categorySlug?: string, maxPriceEur?: number): Promise<ChatProduct[]> {
  const supabase = createAdminClient()
  // Tokenise, drop generic words, strip plurals, expand aliases → forgiving OR search.
  const STOP = new Set(['product', 'products', 'item', 'items', 'device', 'devices', 'thing', 'things', 'show', 'find', 'get', 'want', 'need', 'looking', 'the', 'for', 'me', 'my', 'some', 'any', 'best', 'good', 'top', 'new', 'available', 'stock', 'wholesale', 'retail', 'please', 'can', 'you', 'and', 'with', 'what', 'which', 'have', 'cheap', 'cheapest', 'budget', 'price', 'prices'])
  const raw = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !STOP.has(t) && !STOP.has(t.replace(/s$/, '')))
  const terms = new Set<string>()
  for (const t of raw) {
    const sing = t.replace(/s$/, '')
    terms.add(sing); terms.add(t)
    for (const [k, syns] of Object.entries(SEARCH_ALIASES)) if (t === k || sing === k) syns.forEach((s) => terms.add(s))
  }
  const termArr = Array.from(terms)
  const ors: string[] = []
  for (const t of termArr) { ors.push(`name.ilike.%${t}%`); ors.push(`brand_name.ilike.%${t}%`) }

  let q = (supabase.from('products') as any)
    .select('id, name, slug, price_cents, currency_code, brand_name, categories(name, slug), product_images(url, sort_order)')
    .eq('is_published', true)
  if (ors.length) q = q.or(ors.join(','))
  if (maxPriceEur) q = q.lte('price_cents', Math.round(maxPriceEur * 100))
  q = q.limit(50)

  const { data } = await q
  const ql = query.toLowerCase().trim()
  const cheap = /\b(cheap|cheapest|budget|affordable|low ?price)\b/.test(ql)
  const ACC = /(case|cover|cable|adapter|charger|glass|protector|holder|stand|strap|\bband\b|sticker|skin|pellicola|custodia|cavo)/i
  const ranked = (data ?? []).map((p: any) => {
    const n = (p.name ?? '').toLowerCase()
    let score = 0
    if (n.includes(ql)) score += 50
    for (const t of termArr) if (n.includes(t)) score += 6
    if (p.brand_name && terms.has((p.brand_name as string).toLowerCase())) score += 8
    if (ACC.test(n) && !ACC.test(ql)) score -= 25 // user asked for a device, not an accessory
    if ((p.price_cents ?? 0) < 100) score -= 8 // a €0.x item is usually an accessory/part
    return { p, score }
  }).filter((x: any) => x.score > -10)
    .sort((a: any, b: any) => b.score - a.score || (cheap ? a.p.price_cents - b.p.price_cents : b.p.price_cents - a.p.price_cents))
    .slice(0, 6)

  return ranked.map(({ p }: any) => {
    const cat = p.categories as any as { name: string; slug: string } | null
    const imgs = ((p.product_images ?? []) as { url: string; sort_order: number }[]).sort((a, b) => a.sort_order - b.sort_order)
    return { id: p.id, name: p.name, slug: p.slug, price_cents: p.price_cents, currency_code: p.currency_code, category_name: cat?.name ?? null, image_url: imgs[0]?.url ?? null }
  }) as ChatProduct[]
}

async function getSupplierInfo(name: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('suppliers')
    .select('id, trade_name, legal_name, description, status, reliability_tier, marketplace_context, countries(name)')
    .or(`trade_name.ilike.%${name}%,legal_name.ilike.%${name}%`)
    .eq('status', 'ACTIVE')
    .limit(3)
  return data ?? []
}

async function contactSupplier(supplierName: string, message: string, userId: string) {
  const supabase = createAdminClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, trade_name, legal_name')
    .or(`trade_name.ilike.%${supplierName}%,legal_name.ilike.%${supplierName}%`)
    .eq('status', 'ACTIVE')
    .limit(1)
    .single()

  if (!supplier) return { error: 'Supplier not found' }

  // Find or create conversation
  let { data: conv } = await supabase
    .from('conversations' as any)
    .select('id')
    .eq('buyer_id', userId)
    .eq('supplier_id', supplier.id)
    .is('order_id', null)
    .single() as any

  if (!conv) {
    const { data: newConv } = await (supabase.from('conversations' as any) as any).insert({
      buyer_id: userId,
      supplier_id: supplier.id,
      subject: 'Inquiry via AI Assistant',
      last_message_at: new Date().toISOString(),
    }).select('id').single()
    conv = newConv
  }

  if (!conv?.id) return { error: 'Could not create conversation' }

  // Send message
  await (supabase.from('messages' as any) as any).insert({
    conversation_id: conv.id,
    sender_id: userId,
    body: message,
  })

  // Update last_message_at
  await (supabase.from('conversations' as any) as any).update({ last_message_at: new Date().toISOString() }).eq('id', conv.id)

  return {
    success: true,
    supplier_name: supplier.trade_name ?? supplier.legal_name,
    conversation_url: '/buyer/messages',
  }
}

async function saveChatMessage(sessionKey: string, userId: string | null, role: 'user' | 'assistant', content: string, products: ChatProduct[] = []) {
  const supabase = createAdminClient()
  await (supabase.from('ai_chats' as any) as any).insert({
    session_key: sessionKey,
    user_id: userId || null,
    role,
    content,
    products: products.length ? products : [],
  })
}

export async function POST(req: NextRequest) {
  const apiKey = await getOpenAIKey()
  if (!apiKey) {
    return NextResponse.json({ content: 'The AI assistant is not configured yet. You can still browse the Marketplace, Suppliers and Shopping Mall.', products: [] })
  }
  const openai = new OpenAI({ apiKey })

  const { messages, sessionKey } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    sessionKey: string
  }

  // Get current user (cookie-based — works from browser)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.slice(-14),
  ]

  let collectedProducts: ChatProduct[] = []
  let chatAction: ChatAction | null = null

  try {

  let response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: apiMessages,
    tools,
    tool_choice: 'auto',
    max_tokens: 700,
    temperature: 0.7,
  })

  // Tool call loop (max 3 rounds)
  let rounds = 0
  while (response.choices[0].finish_reason === 'tool_calls' && rounds < 3) {
    rounds++
    const assistantMsg = response.choices[0].message
    apiMessages.push(assistantMsg)

    const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = []

    for (const tc of assistantMsg.tool_calls ?? []) {
      if (!('function' in tc)) continue

      if (tc.function.name === 'search_products') {
        const args = JSON.parse(tc.function.arguments) as { query: string; category_slug?: string; max_price_eur?: number }
        const products = await searchProducts(args.query, args.category_slug, args.max_price_eur)
        collectedProducts.push(...products)
        toolResults.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: products.length > 0
            ? JSON.stringify(products.map((p) => ({ name: p.name, price: `${(p.price_cents / 100).toFixed(2)} ${p.currency_code}`, category: p.category_name, slug: p.slug })))
            : 'No products found. Try broader search terms.',
        })
      }

      if (tc.function.name === 'get_supplier_info') {
        const args = JSON.parse(tc.function.arguments) as { name: string }
        const suppliers = await getSupplierInfo(args.name)
        toolResults.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: suppliers.length > 0
            ? JSON.stringify(suppliers.map((s: any) => ({ name: s.trade_name ?? s.legal_name, description: s.description, tier: s.reliability_tier, country: (s.countries as any)?.name })))
            : 'Supplier not found.',
        })
      }

      if (tc.function.name === 'contact_supplier') {
        const args = JSON.parse(tc.function.arguments) as { supplier_name: string; message: string }
        if (!userId) {
          toolResults.push({ role: 'tool', tool_call_id: tc.id, content: 'User is not logged in. Ask them to log in first.' })
        } else {
          const result = await contactSupplier(args.supplier_name, args.message, userId)
          if (result.success) {
            chatAction = { type: 'message_sent', supplier_name: result.supplier_name!, conversation_url: result.conversation_url! }
            toolResults.push({ role: 'tool', tool_call_id: tc.id, content: `Message sent to ${result.supplier_name} successfully.` })
          } else {
            toolResults.push({ role: 'tool', tool_call_id: tc.id, content: result.error ?? 'Failed to send message.' })
          }
        }
      }
    }

    apiMessages.push(...toolResults)

    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      tools,
      tool_choice: 'auto',
      max_tokens: 700,
      temperature: 0.7,
    })
  }

  const finalContent = response.choices[0].message.content ?? ''

  // Deduplicate products
  const seen = new Set<string>()
  const uniqueProducts = collectedProducts.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true })

  // Save to DB (fire and forget)
  const lastUserMsg = messages[messages.length - 1]
  if (lastUserMsg?.role === 'user' && sessionKey) {
    saveChatMessage(sessionKey, userId, 'user', lastUserMsg.content).catch(() => {})
    saveChatMessage(sessionKey, userId, 'assistant', finalContent, uniqueProducts).catch(() => {})
  }

  return NextResponse.json({ content: finalContent, products: uniqueProducts, action: chatAction })

  } catch (err: any) {
    const code = err?.status === 401 || /api key/i.test(err?.message ?? '') ? 'key' : 'other'
    console.error('AI chat error:', err?.status, err?.message)
    return NextResponse.json({
      content: code === 'key'
        ? "I'm not fully set up yet — the AI key needs configuring. Meanwhile, you can browse the Marketplace, Suppliers and Shopping Mall. 🙂"
        : "I'm having trouble connecting right now. Please try again in a moment.",
      products: [],
    })
  }
}
