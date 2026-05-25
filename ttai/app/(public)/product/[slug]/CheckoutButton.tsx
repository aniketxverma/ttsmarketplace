'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/CartContext'
import { useRouter } from 'next/navigation'

interface Props {
  productId: string
  name: string
  price_cents: number
  currency_code: string
  imageUrl?: string
  supplierName: string
  min_order_qty: number
  disabled?: boolean
}

export function CheckoutButton({
  productId, name, price_cents, currency_code,
  imageUrl, supplierName, min_order_qty, disabled,
}: Props) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  const minQty = Math.max(1, min_order_qty)
  const [qty, setQty] = useState(minQty)

  function handleAddToCart() {
    addItem({ productId, name, price_cents, currency_code, imageUrl, supplierName, min_order_qty })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    addItem({ productId, name, price_cents, currency_code, imageUrl, supplierName, min_order_qty })
    router.push('/checkout')
  }

  return (
    <div className="space-y-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setQty(q => Math.max(minQty, q - minQty))}
            disabled={disabled || qty <= minQty}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors font-bold disabled:opacity-40"
          >
            −
          </button>
          <span className="px-4 py-2 font-semibold text-sm border-x min-w-[3rem] text-center">{qty}</span>
          <button
            onClick={() => setQty(q => q + minQty)}
            disabled={disabled}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors font-bold disabled:opacity-40"
          >
            +
          </button>
        </div>
        {min_order_qty > 1 && (
          <span className="text-xs text-gray-400">MOQ: {min_order_qty}</span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#0B1F4D] px-4 py-3 text-sm font-bold transition-all duration-200 disabled:opacity-50 ${
            added
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'text-[#0B1F4D] hover:bg-[#0B1F4D] hover:text-white'
          }`}
        >
          {added ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Added!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={disabled}
          className="flex-1 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-4 py-3 text-sm font-bold hover:bg-[#fbb93a] hover:shadow-lg hover:shadow-[#F5A623]/30 transition-all duration-200 disabled:opacity-50 hover:-translate-y-0.5"
        >
          Buy Now
        </button>
      </div>

      {disabled && (
        <p className="text-sm text-red-500 text-center">This product is out of stock</p>
      )}
    </div>
  )
}
