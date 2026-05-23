import Link from 'next/link'

interface CompletionItem {
  label: string
  done: boolean
  href: string
  points: number
}

interface Props {
  items: CompletionItem[]
}

export function ProfileCompletion({ items }: Props) {
  const total = items.reduce((s, i) => s + i.points, 0)
  const earned = items.filter((i) => i.done).reduce((s, i) => s + i.points, 0)
  const pct = Math.round((earned / total) * 100)

  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-[#F5A623]' : 'bg-red-400'
  const textColor = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-[#F5A623]' : 'text-red-500'

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[#0B1F4D]">Profile Completion</h2>
        <span className={`text-2xl font-extrabold ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
        <div className={`h-2.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${item.done ? 'opacity-60' : 'hover:bg-gray-50'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'bg-gray-200'}`}>
              {item.done ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-400" />
              )}
            </span>
            <span className={item.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}>{item.label}</span>
            {!item.done && <span className="ml-auto text-[10px] font-bold text-gray-400">+{item.points}pts</span>}
          </Link>
        ))}
      </div>
      {pct < 100 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Complete your profile to rank higher in search results
        </p>
      )}
    </div>
  )
}
