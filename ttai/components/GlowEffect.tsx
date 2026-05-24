'use client'

/**
 * GlowEffect — global click glow for all buttons and styled anchors.
 *
 * How it works:
 *  - Uses event delegation on the document (one listener, zero per-button code).
 *  - On every click, checks if the target is (or is inside) a button or a
 *    link styled as a button.
 *  - Creates a fixed-position radial glow disc at the exact cursor position.
 *  - mix-blend-mode: screen  →  the glow adds light on top of whatever
 *    colour the button is, making it look like a real backlit pulse rather
 *    than a painted overlay.
 *  - The disc is removed from the DOM the instant its animation ends, so
 *    there is zero memory/DOM accumulation.
 *
 * No data-attributes or class changes needed on any button.
 */

import { useEffect } from 'react'

// Glow colour variants — matched to button background colour so each button
// radiates its own natural colour family.
function glowColor(el: Element): string {
  const cls = el.getAttribute('class') ?? ''
  if (/bg-green/.test(cls))  return 'rgba(34,197,94,0.55)'
  if (/bg-amber|bg-\[#F5A623\]/.test(cls)) return 'rgba(245,166,35,0.60)'
  if (/bg-red|bg-rose/.test(cls))   return 'rgba(239,68,68,0.55)'
  if (/bg-purple|bg-violet/.test(cls)) return 'rgba(139,92,246,0.55)'
  if (/bg-cyan|bg-teal/.test(cls))  return 'rgba(34,211,238,0.55)'
  // default — warm gold (matches brand)
  return 'rgba(201,168,76,0.55)'
}

export function GlowEffect() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      // Identify the interactive element
      const target = e.target as Element
      const btn = target.closest(
        'button:not([disabled]),' +
        'a[class*="rounded-"][class*="bg-"],' +
        'a[class*="rounded-"][class*="border"],' +
        '[data-glow]'
      )
      if (!btn) return

      // Glow disc dimensions — 3× the element's larger dimension so it
      // always extends well beyond the button edges (backlit feel).
      const rect  = btn.getBoundingClientRect()
      const span  = Math.max(rect.width, rect.height) * 3.2
      const color = glowColor(btn)

      const disc = document.createElement('div')
      Object.assign(disc.style, {
        position:        'fixed',
        left:            `${e.clientX - span / 2}px`,
        top:             `${e.clientY - span / 2}px`,
        width:           `${span}px`,
        height:          `${span}px`,
        borderRadius:    '50%',
        background:      `radial-gradient(circle, ${color} 0%, ${color.replace(/[\d.]+\)$/, '0.12)')} 45%, transparent 70%)`,
        pointerEvents:   'none',
        zIndex:          '9998',
        mixBlendMode:    'screen',   // ← the "glow from behind" magic
        transform:       'scale(0.15)',
        animation:       'glowBurst 0.72s cubic-bezier(0.22,0.9,0.36,1) forwards',
        willChange:      'transform, opacity',
      })

      document.body.appendChild(disc)
      disc.addEventListener('animationend', () => disc.remove(), { once: true })
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return null
}
