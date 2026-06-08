'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { PurchaseUnit } from '@/lib/packaging'

export interface CartItem {
  id: string                 // composite line key: `${productId}:${unit}`
  productId: string
  unit: PurchaseUnit         // piece | box | pallet | truck
  unitLabel?: string         // e.g. 'Pallet' (display)
  name: string
  price_cents: number        // price for ONE of the chosen unit
  currency_code: string
  imageUrl?: string
  supplierName: string
  supplierId?: string            // for grouping + minimum-order-value checks
  supplierMinCents?: number      // supplier's minimum order value (cents)
  quantity: number           // number of that unit
  min_order_qty?: number
  retail?: boolean           // piece bought in the online shop (retail price)
}

/** What callers provide — id/quantity/unit are derived/defaulted. */
type AddInput = Omit<CartItem, 'id' | 'quantity' | 'unit'> & { unit?: PurchaseUnit }

interface CartCtx {
  items: CartItem[]
  addItem: (item: AddInput, qty?: number) => void
  removeItem: (lineId: string) => void
  setQty: (lineId: string, qty: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  itemCount: number
  totalCents: number
}

const CartContext = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ttai_cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem('ttai_cart', JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((item: AddInput, qty?: number) => {
    const unit = item.unit ?? 'piece'
    const id = `${item.productId}:${unit}`
    const addQty = qty ?? Math.max(1, item.min_order_qty ?? 1)
    setItems(prev => {
      const existing = prev.find(i => i.id === id)
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + addQty } : i)
      }
      return [...prev, { ...item, unit, id, quantity: addQty }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((lineId: string) => {
    setItems(prev => prev.filter(i => i.id !== lineId))
  }, [])

  const setQty = useCallback((lineId: string, qty: number) => {
    if (qty < 1) { removeItem(lineId); return }
    setItems(prev => prev.map(i => i.id === lineId ? { ...i, quantity: qty } : i))
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const totalCents = items.reduce((s, i) => s + i.price_cents * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, setQty, clearCart,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
      itemCount, totalCents,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
