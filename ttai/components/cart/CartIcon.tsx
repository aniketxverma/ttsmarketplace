'use client'

import { useCart } from '@/lib/cart/CartContext'

export function CartIcon() {
  const { itemCount, openCart } = useCart()

  return (
    <button
      onClick={openCart}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Open cart"
    >
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-black flex items-center justify-center leading-none animate-scale-in">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  )
}
