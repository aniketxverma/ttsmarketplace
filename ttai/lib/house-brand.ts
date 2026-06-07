/**
 * House brand for the consumer Online Store (the "Shop / TTAIEMA Store" surface).
 *
 * In the retail storefront the platform is the single seller-of-record: products
 * from the companies that join and are managed by us are all presented under the
 * one TTAIEMA profile. End customers never see the underlying supplier — only
 * TTAIEMA. The real `supplier_id` is kept in the database for fulfilment /
 * dropshipping; this is purely a presentation identity used in retail contexts.
 */
export const HOUSE_BRAND = {
  name: 'TTAIEMA',
  tagline: 'Official TTAIEMA Store · curated & fulfilled by us',
  badge: 'Official Store',
  href: '/store',
} as const
