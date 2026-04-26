import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 characters'),
  fullName: z.string().min(2).max(100),
  role: z.enum(['buyer', 'business_client', 'supplier', 'broker']).default('buyer'),
})

export const resetRequestSchema = z.object({
  email: z.string().email(),
})

export const resetConfirmSchema = z
  .object({
    password: z.string().min(8),
    passwordConfirm: z.string().min(8),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  })

// ─── Supplier ─────────────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
  legalName: z.string().min(2).max(200),
  tradeName: z.string().max(200).optional(),
  taxId: z.string().min(3).max(50),
  vatNumber: z.string().max(20).optional(),
  countryId: z.string().uuid(),
  cityId: z.string().uuid().optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  marketplaceContext: z.enum(['wholesale', 'retail', 'both']).default('wholesale'),
  description: z.string().max(2000).optional(),
})

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  marketplaceContext: z.enum(['wholesale', 'retail', 'both']),
  cityId: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  description: z.string().max(5000).optional(),
  sku: z.string().max(100).optional(),
  priceCents: z.number().int().positive(),
  currencyCode: z.string().length(3).default('EUR'),
  minOrderQty: z.number().int().positive().default(1),
  stockQty: z.number().int().min(0).default(0),
  vatRate: z.number().min(0).max(100).optional(),
  weightGrams: z.number().int().positive().optional(),
})

// ─── Broker ───────────────────────────────────────────────────────────────────

export const createBrokerSchema = z.object({
  legalName: z.string().min(2).max(200),
  taxId: z.string().min(3).max(50),
  vatNumber: z.string().max(20).optional(),
  taxJurisdiction: z.string().length(2).default('ES'),
})

export const updateCommissionSchema = z.object({
  commissionPct: z.number().min(0).max(50),
  fixedFeeCents: z.number().int().min(0),
  brokerSharePct: z.number().min(0).max(50),
})

// ─── Admin ────────────────────────────────────────────────────────────────────

export const transitionSupplierSchema = z.object({
  targetStatus: z.enum(['PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED']),
  reason: z.string().min(5).max(500),
})

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const checkoutSessionSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postalCode: z.string(),
    countryIso: z.string().length(2),
  }),
  buyerIsVatRegistered: z.boolean().default(false),
  buyerVatNumber: z.string().optional(),
  idempotencyKey: z.string().uuid(),
})

// ─── Promotions ───────────────────────────────────────────────────────────────

export const createPromotionSchema = z
  .object({
    productId: z.string().uuid(),
    promotionSlot: z.number().int().min(1).max(10),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    customPitch: z.string().max(500).optional(),
  })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
    message: 'End must be after start',
    path: ['endsAt'],
  })
