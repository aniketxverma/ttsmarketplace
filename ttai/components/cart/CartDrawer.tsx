'use client'

import { useCart } from '@/lib/cart/CartContext'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, setQty, totalCents, clearCart } = useCart()

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="font-bold text-[#0B1F4D] text-lg">Your Cart</h2>
            {items.length > 0 && (
              <span className="bg-[#0B1F4D] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Browse products and add items to get started</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 rounded-lg bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#162d6e] transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 p-4 hover:bg-gray-50 transition-colors">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.supplierName}</p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty stepper */}
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQty(item.productId, item.quantity - Math.max(1, item.min_order_qty))}
                          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-bold"
                        >
                          −
                        </button>
                        <span className="px-3 py-1.5 text-sm font-semibold border-x min-w-[2.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setQty(item.productId, item.quantity + Math.max(1, item.min_order_qty))}
                          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-bold"
                        >
                          +
                        </button>
                      </div>

                      <p className="font-bold text-[#0B1F4D] text-sm">
                        {fmt(item.price_cents * item.quantity, item.currency_code)}
                      </p>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 h-fit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-gray-50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="font-bold text-[#0B1F4D] text-lg">
                {fmt(totalCents, items[0]?.currency_code ?? 'EUR')}
              </span>
            </div>
            <p className="text-xs text-gray-400">Shipping and VAT calculated at checkout</p>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full rounded-xl bg-[#0B1F4D] text-white text-center py-3.5 text-sm font-bold hover:bg-[#162d6e] transition-colors hover:shadow-lg"
            >
              Proceed to Checkout →
            </Link>

            <div className="flex justify-between text-xs">
              <button onClick={closeCart} className="text-gray-400 hover:text-gray-600 transition-colors">
                Continue Shopping
              </button>
              <button onClick={() => { clearCart(); }} className="text-red-400 hover:text-red-600 transition-colors">
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
