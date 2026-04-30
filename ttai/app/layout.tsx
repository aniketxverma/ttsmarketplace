import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { CartProvider } from '@/lib/cart/CartContext'
import { ChatWidget } from '@/components/ai/ChatWidget'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TTAI — Global Trade Ecosystem',
  description: 'B2B wholesale marketplace and B2C city store platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          {children}
          <ChatWidget />
        </CartProvider>
        <Toaster />
      </body>
    </html>
  )
}
