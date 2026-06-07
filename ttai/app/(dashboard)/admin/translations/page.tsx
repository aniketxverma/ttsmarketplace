import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { TranslationManager } from './TranslationManager'

export default async function AdminTranslationsPage() {
  await requireRole('admin')
  const admin = createAdminClient()

  const { data: settingsRows } = await (admin.from('app_settings') as any).select('key, value').like('key', 'translation_%')
  const s: Record<string, string> = Object.fromEntries(((settingsRows ?? []) as any[]).map((r) => [r.key, r.value]))

  const initial = {
    enabled: (s.translation_enabled ?? 'true') !== 'false',
    provider: s.translation_provider || 'openai',
    hasOpenai: !!s.translation_openai_key,
    hasAnthropic: !!s.translation_anthropic_key,
    hasDeepl: !!s.translation_deepl_key,
  }

  const [{ count: productCount }, { count: cachedCount }] = await Promise.all([
    admin.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true),
    (admin.from('content_translations') as any).select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Translations</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {productCount ?? 0} published products · {cachedCount ?? 0} cached translations.
          Pick a provider, add your API key, and the marketplace auto-translates content into each visitor&apos;s language.
        </p>
      </div>
      <TranslationManager initial={initial} />
    </div>
  )
}
