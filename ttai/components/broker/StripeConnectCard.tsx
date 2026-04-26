interface StripeConnectCardProps {
  complete: boolean
  brokerId: string
}

export function StripeConnectCard({ complete, brokerId }: StripeConnectCardProps) {
  return (
    <div className={`rounded-xl border p-4 flex items-center justify-between ${complete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${complete ? 'bg-green-100' : 'bg-yellow-100'}`}>
          {complete ? (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${complete ? 'text-green-800' : 'text-yellow-800'}`}>
            {complete ? 'Stripe Account Connected' : 'Stripe Onboarding Required'}
          </p>
          <p className={`text-xs ${complete ? 'text-green-600' : 'text-yellow-600'}`}>
            {complete ? 'You can receive payouts' : 'Complete Stripe onboarding to receive payouts'}
          </p>
        </div>
      </div>
      {!complete && (
        <a
          href="/broker/onboarding"
          className="text-xs font-medium text-yellow-700 hover:text-yellow-900 underline"
        >
          Complete Setup
        </a>
      )}
    </div>
  )
}
