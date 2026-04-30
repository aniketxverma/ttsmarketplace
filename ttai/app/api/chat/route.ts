import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are TTAI Assistant — the AI shopping guide for TTAI EMA Marketplace, a global B2B and B2C trade platform connecting buyers with verified suppliers from the Middle East, Europe, Asia, Africa, and the Americas.

You help users:
- Discover products and find exactly what they need
- Get pricing and availability information
- Understand product categories and regional suppliers
- Compare products and make informed purchase decisions
- Navigate the marketplace

When users ask about products, ALWAYS use the search_products tool to find real listings. Show 3-5 relevant results.
Be concise, friendly, and helpful. Keep responses short — 1-3 sentences plus product results.
If no products match, suggest broader search terms or related categories.
Format prices clearly. Always mention if a product is from a specific region when relevant.`

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products in the TTAI marketplace by keywords, category, or price',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keywords (product name, use case, material, etc.)',
          },
          category: {
            type: 'string',
            description: 'Category slug filter (e.g. agriculture-food, electronics-technology, textiles-apparel, construction-materials, health-beauty, home-garden)',
          },
          max_price_eur: {
            type: 'number',
            description: 'Maximum price in EUR (e.g. 50 means max €50)',
          },
        },
        required: ['query'],
      },
    },
  },
]

export interface ChatProduct {
  id: string
  name: string
  slug: string
  price_cents: number
  currency_code: string
  category_name: string | null
  image_url: string | null
}

async function searchProducts(
  query: string,
  category?: string,
  maxPriceEur?: number,
): Promise<ChatProduct[]> {
  const supabase = createClient()

  let q = supabase
    .from('products')
    .select('id, name, slug, price_cents, currency_code, categories(name), product_images(url, sort_order)')
    .eq('is_published', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(5)

  if (maxPriceEur) {
    q = q.lte('price_cents', Math.round(maxPriceEur * 100))
  }

  const { data } = await q

  return (data ?? []).map((p) => {
    const cat = p.categories as any as { name: string } | null
    const imgs = ((p.product_images ?? []) as { url: string; sort_order: number }[])
      .sort((a, b) => a.sort_order - b.sort_order)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price_cents: p.price_cents,
      currency_code: p.currency_code,
      category_name: cat?.name ?? null,
      image_url: imgs[0]?.url ?? null,
    }
  })
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const { messages } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
  }

  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.slice(-12), // keep last 12 messages for context
  ]

  let collectedProducts: ChatProduct[] = []

  // First call
  let response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: apiMessages,
    tools,
    tool_choice: 'auto',
    max_tokens: 600,
    temperature: 0.7,
  })

  // Handle tool calls (max 2 rounds)
  let rounds = 0
  while (response.choices[0].finish_reason === 'tool_calls' && rounds < 2) {
    rounds++
    const assistantMsg = response.choices[0].message
    apiMessages.push(assistantMsg)

    const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = []
    for (const tc of assistantMsg.tool_calls ?? []) {
      if (!('function' in tc)) continue
      if (tc.function.name === 'search_products') {
        const args = JSON.parse(tc.function.arguments) as {
          query: string
          category?: string
          max_price_eur?: number
        }
        const products = await searchProducts(args.query, args.category, args.max_price_eur)
        collectedProducts = [...collectedProducts, ...products]
        toolResults.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(
            products.length > 0
              ? products.map((p) => ({
                  name: p.name,
                  price: `${(p.price_cents / 100).toFixed(2)} ${p.currency_code}`,
                  category: p.category_name,
                  slug: p.slug,
                }))
              : 'No products found matching this search.',
          ),
        })
      }
    }

    apiMessages.push(...toolResults)

    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      tools,
      tool_choice: 'auto',
      max_tokens: 600,
      temperature: 0.7,
    })
  }

  // Deduplicate products by id
  const seen = new Set<string>()
  const uniqueProducts = collectedProducts.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  return NextResponse.json({
    content: response.choices[0].message.content ?? '',
    products: uniqueProducts,
  })
}
