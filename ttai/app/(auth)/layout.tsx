export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1F4D]/5 via-white to-[#F5A623]/5 px-4 py-8">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}
