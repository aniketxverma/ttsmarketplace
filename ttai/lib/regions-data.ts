export interface VisualCategory {
  id: string
  name: string
  tagline: string
  image: string
  marketplaceUrl: string
}

export interface Country {
  id: string
  name: string
  flag: string
  image: string
  tagline: string
  categories: VisualCategory[]
}

export interface Region {
  id: string
  name: string
  tagline: string
  image: string
  accentColor: string
  countries: Country[]
}

const VISUAL_CATEGORIES: Record<string, VisualCategory> = {
  modernInteriors: {
    id: 'modern-interiors',
    name: 'Modern Interiors',
    tagline: 'Sleek furniture & decor for contemporary living',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    marketplaceUrl: '/marketplace?q=furniture+interior',
  },
  professionalKitchens: {
    id: 'professional-kitchens',
    name: 'Professional Kitchens',
    tagline: 'Commercial-grade equipment for restaurants & hotels',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    marketplaceUrl: '/marketplace?category=agriculture-food',
  },
  industrialEssentials: {
    id: 'industrial-essentials',
    name: 'Industrial Essentials',
    tagline: 'Raw materials, tools & safety equipment',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    marketplaceUrl: '/marketplace?category=industrial-machinery',
  },
  officeWorkspace: {
    id: 'office-workspace',
    name: 'Office & Workspace',
    tagline: 'Premium setups for modern working environments',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    marketplaceUrl: '/marketplace?category=electronics-technology',
  },
  foodHospitality: {
    id: 'food-hospitality',
    name: 'Food & Hospitality',
    tagline: 'Premium provisions for restaurants, hotels & cafes',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    marketplaceUrl: '/marketplace?category=agriculture-food',
  },
  outdoorLiving: {
    id: 'outdoor-living',
    name: 'Outdoor Living',
    tagline: 'Furniture & accessories for terraces and gardens',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    marketplaceUrl: '/marketplace?q=outdoor+garden',
  },
  healthWellness: {
    id: 'health-wellness',
    name: 'Health & Wellness',
    tagline: 'Personal care, beauty & hygiene essentials',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
    marketplaceUrl: '/marketplace?category=health-beauty',
  },
  electronicstech: {
    id: 'electronics-tech',
    name: 'Electronics & Tech',
    tagline: 'Devices, components & smart solutions',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    marketplaceUrl: '/marketplace?category=electronics-technology',
  },
  cleaningHousehold: {
    id: 'cleaning-household',
    name: 'Cleaning & Household',
    tagline: 'Professional-grade cleaning products & supplies',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
    marketplaceUrl: '/marketplace?q=cleaning',
  },
  luxuryLiving: {
    id: 'luxury-living',
    name: 'Luxury Living',
    tagline: 'High-end home goods for premium residences',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    marketplaceUrl: '/marketplace?q=luxury+home',
  },
}

export const REGIONS: Region[] = [
  {
    id: 'middle-east',
    name: 'Middle East',
    tagline: 'From historic souks to gleaming skylines',
    image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80',
    accentColor: '#C8930A',
    countries: [
      {
        id: 'dubai',
        name: 'Dubai',
        flag: '🇦🇪',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80',
        tagline: 'Luxury meets innovation in the city of the future',
        categories: [
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.luxuryLiving,
          VISUAL_CATEGORIES.professionalKitchens,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.outdoorLiving,
          VISUAL_CATEGORIES.electronicstech,
        ],
      },
      {
        id: 'saudi-arabia',
        name: 'Saudi Arabia',
        flag: '🇸🇦',
        image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=900&q=80',
        tagline: 'A kingdom rising — Vision 2030 is reshaping everything',
        categories: [
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.electronicstech,
        ],
      },
      {
        id: 'lebanon',
        name: 'Lebanon',
        flag: '🇱🇧',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
        tagline: 'Mediterranean trade heritage meets modern commerce',
        categories: [
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.professionalKitchens,
          VISUAL_CATEGORIES.outdoorLiving,
        ],
      },
      {
        id: 'qatar',
        name: 'Qatar',
        flag: '🇶🇦',
        image: 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=900&q=80',
        tagline: 'World-class infrastructure and global ambition',
        categories: [
          VISUAL_CATEGORIES.luxuryLiving,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.professionalKitchens,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.outdoorLiving,
        ],
      },
      {
        id: 'kuwait',
        name: 'Kuwait',
        flag: '🇰🇼',
        image: 'https://images.unsplash.com/photo-1489468258673-31bfbfa8a5b3?w=900&q=80',
        tagline: 'Prosperous Gulf trade gateway',
        categories: [
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.officeWorkspace,
        ],
      },
      {
        id: 'jordan',
        name: 'Jordan',
        flag: '🇯🇴',
        image: 'https://images.unsplash.com/photo-1548695977-b13c5c95b3a5?w=900&q=80',
        tagline: 'Ancient crossroads of global trade routes',
        categories: [
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.professionalKitchens,
        ],
      },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    tagline: 'Quality, precision and centuries of craftsmanship',
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80',
    accentColor: '#003399',
    countries: [
      {
        id: 'germany',
        name: 'Germany',
        flag: '🇩🇪',
        image: 'https://images.unsplash.com/photo-1546566073-5f5f3f7a0e68?w=900&q=80',
        tagline: 'Engineering excellence and industrial leadership',
        categories: [
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.professionalKitchens,
        ],
      },
      {
        id: 'france',
        name: 'France',
        flag: '🇫🇷',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=80',
        tagline: 'The art of living — luxury, style and savoir-faire',
        categories: [
          VISUAL_CATEGORIES.luxuryLiving,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.outdoorLiving,
          VISUAL_CATEGORIES.professionalKitchens,
        ],
      },
      {
        id: 'uk',
        name: 'United Kingdom',
        flag: '🇬🇧',
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&q=80',
        tagline: 'Global trade heritage and world-class manufacturing',
        categories: [
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.healthWellness,
        ],
      },
      {
        id: 'italy',
        name: 'Italy',
        flag: '🇮🇹',
        image: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=900&q=80',
        tagline: 'Design, fashion and the finest manufacturing tradition',
        categories: [
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.luxuryLiving,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.outdoorLiving,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.professionalKitchens,
        ],
      },
      {
        id: 'turkey',
        name: 'Turkey',
        flag: '🇹🇷',
        image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=900&q=80',
        tagline: 'Bridge between East and West — trade at scale',
        categories: [
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.outdoorLiving,
        ],
      },
    ],
  },
  {
    id: 'asia',
    name: 'Asia',
    tagline: 'The engine of global manufacturing and innovation',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
    accentColor: '#C0392B',
    countries: [
      {
        id: 'china',
        name: 'China',
        flag: '🇨🇳',
        image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=900&q=80',
        tagline: "The world's manufacturing powerhouse",
        categories: [
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.professionalKitchens,
        ],
      },
      {
        id: 'japan',
        name: 'Japan',
        flag: '🇯🇵',
        image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=900&q=80',
        tagline: 'Precision, technology and enduring quality',
        categories: [
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.professionalKitchens,
        ],
      },
      {
        id: 'india',
        name: 'India',
        flag: '🇮🇳',
        image: 'https://images.unsplash.com/photo-1524492412937-b28074a47d70?w=900&q=80',
        tagline: "Diverse industries powering the world's supply chains",
        categories: [
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.modernInteriors,
        ],
      },
      {
        id: 'singapore',
        name: 'Singapore',
        flag: '🇸🇬',
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=900&q=80',
        tagline: 'Asia\'s premier trade and logistics hub',
        categories: [
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.luxuryLiving,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.healthWellness,
        ],
      },
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    tagline: 'A continent of opportunity and rising markets',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80',
    accentColor: '#27AE60',
    countries: [
      {
        id: 'morocco',
        name: 'Morocco',
        flag: '🇲🇦',
        image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=900&q=80',
        tagline: 'Gateway to Africa with a rich trading heritage',
        categories: [
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.outdoorLiving,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.professionalKitchens,
        ],
      },
      {
        id: 'egypt',
        name: 'Egypt',
        flag: '🇪🇬',
        image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=900&q=80',
        tagline: 'North Africa\'s largest economy and trade hub',
        categories: [
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.electronicstech,
        ],
      },
      {
        id: 'south-africa',
        name: 'South Africa',
        flag: '🇿🇦',
        image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=900&q=80',
        tagline: 'Sub-Saharan Africa\'s most developed economy',
        categories: [
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.outdoorLiving,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.electronicstech,
        ],
      },
    ],
  },
  {
    id: 'americas',
    name: 'Americas',
    tagline: 'Vast markets stretching from coast to coast',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
    accentColor: '#2C3E50',
    countries: [
      {
        id: 'usa',
        name: 'United States',
        flag: '🇺🇸',
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=900&q=80',
        tagline: 'The world\'s largest consumer market',
        categories: [
          VISUAL_CATEGORIES.electronicstech,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.modernInteriors,
        ],
      },
      {
        id: 'canada',
        name: 'Canada',
        flag: '🇨🇦',
        image: 'https://images.unsplash.com/photo-1535776781789-3d4a28f500f4?w=900&q=80',
        tagline: 'Natural resources and world-class quality standards',
        categories: [
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.outdoorLiving,
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.cleaningHousehold,
          VISUAL_CATEGORIES.officeWorkspace,
          VISUAL_CATEGORIES.electronicstech,
        ],
      },
      {
        id: 'brazil',
        name: 'Brazil',
        flag: '🇧🇷',
        image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=900&q=80',
        tagline: 'Latin America\'s largest industrial economy',
        categories: [
          VISUAL_CATEGORIES.foodHospitality,
          VISUAL_CATEGORIES.industrialEssentials,
          VISUAL_CATEGORIES.modernInteriors,
          VISUAL_CATEGORIES.outdoorLiving,
          VISUAL_CATEGORIES.healthWellness,
          VISUAL_CATEGORIES.cleaningHousehold,
        ],
      },
    ],
  },
]

export function getRegion(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id)
}

export function getCountry(regionId: string, countryId: string): { region: Region; country: Country } | undefined {
  const region = getRegion(regionId)
  if (!region) return undefined
  const country = region.countries.find((c) => c.id === countryId)
  if (!country) return undefined
  return { region, country }
}
