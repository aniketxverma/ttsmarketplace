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
  // Resolves all relative OG/Twitter image URLs to absolute — required for link
  // previews (WhatsApp, Facebook, X, etc.) to show images.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ttaiz.com'),
  title: 'TTAI — Global Trade Ecosystem',
  description: 'B2B wholesale marketplace and B2C city store platform',
  // Default share image (TTAIEMA logo) shown when the site link is shared on
  // WhatsApp, Facebook, X, etc. Individual product/brand pages override this.
  openGraph: {
    title: 'TTAIEMA — Global Trade Ecosystem',
    description: 'B2B wholesale marketplace and B2C city store platform',
    siteName: 'TTAIEMA',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1024, height: 1024, alt: 'TTAIEMA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TTAIEMA — Global Trade Ecosystem',
    description: 'B2B wholesale marketplace and B2C city store platform',
    images: ['/og-image.jpg'],
  },
  icons: { icon: '/og-image.jpg', apple: '/og-image.jpg' },
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
