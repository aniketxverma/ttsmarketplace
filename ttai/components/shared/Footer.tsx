import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-8 px-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TTAI. All rights reserved.
        </p>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
          <Link href="/store" className="hover:text-foreground transition-colors">Store</Link>
          <Link href="/register?role=supplier" className="hover:text-foreground transition-colors">Become a Supplier</Link>
        </nav>
      </div>
    </footer>
  )
}
