// Standardized option lists for the Master Product Database.
// Kept on the server and shipped to client components as plain string arrays.

// Item condition — applies to every category (electronics, phones, etc.).
export const CONDITIONS = [
  'Brand New',
  'Open Box',
  'Refurbished A+',
  'Refurbished A',
  'Refurbished B',
  'Used',
  'Clearance',
  'New Defect',
] as const
export type Condition = (typeof CONDITIONS)[number]

// Regional spec for phones / electronics.
export const REGIONS = ['EU', 'UAE', 'USA', 'UK', 'Global'] as const

// Common storage capacities (phones, tablets, laptops).
export const CAPACITIES = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'] as const

// Memory-card form factors.
export const MEMORY_TYPES = ['MicroSD', 'SD', 'USB'] as const

// The variant dimensions the cascade picker walks, in order.
export const VARIANT_DIMENSIONS = ['capacity', 'color', 'region'] as const
export type VariantDimension = (typeof VARIANT_DIMENSIONS)[number]
