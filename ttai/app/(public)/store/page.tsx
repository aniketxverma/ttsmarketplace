import { createClient } from '@/lib/supabase/server'
import { CityPicker } from '@/components/marketplace/CityPicker'

export default async function StorePage() {
  const supabase = createClient()
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, slug')
    .eq('retail_active', true)
    .order('name')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">TTAI City Store</h1>
        <p className="text-muted-foreground mt-2">
          Shop local products from verified suppliers in your city
        </p>
      </div>
      <CityPicker cities={cities ?? []} />
    </div>
  )
}
