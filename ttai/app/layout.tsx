import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { CartProvider } from '@/lib/cart/CartContext'
import { GlowEffect } from '@/components/GlowEffect'
import { LocaleProvider } from '@/lib/i18n/client'
import { getLocale, getMessages } from '@/lib/i18n/server'
import { ChatWidget } from '@/components/ai/ChatWidget'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TTAI — Global Trade Ecosystem',
  description: 'B2B wholesale marketplace and B2C city store platform',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale()
  const messages = await getMessages(locale)
  const dir = messages.dir ?? 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body className={inter.className}>
        <LocaleProvider locale={locale} messages={messages}>
          <CartProvider>
            {children}
            <ChatWidget />
          </CartProvider>
          <Toaster />
          <GlowEffect />
        </LocaleProvider>
      </body>
    </html>
  )
}
