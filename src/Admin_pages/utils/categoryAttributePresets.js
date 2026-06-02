/**
 * Per-category attribute presets.
 * Each entry has { key, label, placeholder?, type? }
 * type: 'text' (default) | 'number' | 'select'
 * options: array of strings (only when type === 'select')
 */
const PRESETS = {
  ring: {
    label: 'Ring',
    subcategories: ['Solitaire', 'Eternity', 'Cocktail', 'Promise', 'Engagement', 'Wedding', 'Statement'],
    fields: [
      { key: 'ringSizeStandard', label: 'Size Standard', type: 'select', options: ['India (numeric)', 'US/Canada', 'UK/Australia', 'Europe'] },
      { key: 'ringSize', label: 'Available Sizes', placeholder: 'e.g. 6, 7, 8, 9 or 5–18' },
      { key: 'stone', label: 'Stone Type', placeholder: 'e.g. Diamond, Emerald, Ruby' },
      { key: 'stoneCut', label: 'Stone Cut', placeholder: 'e.g. Round Brilliant, Princess' },
      { key: 'stoneWeight', label: 'Stone Weight (carats)', placeholder: 'e.g. 0.5' },
      { key: 'bandWidth', label: 'Band Width (mm)', placeholder: 'e.g. 2.5' },
      { key: 'fit', label: 'Fit', type: 'select', options: ['Standard', 'Comfort', 'Flat'] },
    ],
  },
  bangles: {
    label: 'Bangles',
    subcategories: ['Kada', 'Choori', 'Bangle Set', 'Kangan', 'Cuff Bangle'],
    fields: [
      { key: 'bangleSize', label: 'Bangle Size', placeholder: 'e.g. 2.2, 2.4, 2.6, 2.8 (in inches)' },
      { key: 'innerDiameter', label: 'Inner Diameter (mm)', placeholder: 'e.g. 58, 60, 64' },
      { key: 'setCount', label: 'Pieces in Set', placeholder: 'e.g. 2, 4, 6' },
      { key: 'closure', label: 'Closure Type', type: 'select', options: ['Open (adjustable)', 'Slip-on', 'Box clasp', 'Spring ring'] },
      { key: 'banglesPattern', label: 'Pattern', placeholder: 'e.g. Plain, Meenakari, Filigree' },
    ],
  },
  bracelet: {
    label: 'Bracelet',
    subcategories: ['Cuff', 'Charm', 'Tennis', 'Bangle', 'Link', 'Beaded'],
    fields: [
      { key: 'braceletSize', label: 'Bracelet Size', placeholder: 'e.g. 6 inch, 7 inch, 8 inch' },
      { key: 'closure', label: 'Closure Type', type: 'select', options: ['Lobster clasp', 'Toggle', 'Box clasp', 'Magnetic', 'Adjustable'] },
      { key: 'chainType', label: 'Chain Type', placeholder: 'e.g. Figaro, Cable, Box' },
    ],
  },
  necklace: {
    label: 'Necklace',
    subcategories: ['Choker', 'Pendant', 'Collar', 'Princess', 'Matinee', 'Lariat', 'Haar'],
    fields: [
      { key: 'chainLength', label: 'Chain Length', placeholder: 'e.g. 16", 18", 20", 22"' },
      { key: 'pendantType', label: 'Pendant Type', placeholder: 'e.g. Solitaire, Cluster, Locket' },
      { key: 'claspType', label: 'Clasp Type', type: 'select', options: ['Lobster', 'Toggle', 'Spring ring', 'Box', 'Magnetic'] },
      { key: 'layerable', label: 'Layerable', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  earrings: {
    label: 'Earrings',
    subcategories: ['Studs', 'Drops', 'Hoops', 'Chandbali', 'Jhumka', 'Ear Cuff', 'Threader'],
    fields: [
      { key: 'earringStyle', label: 'Style', type: 'select', options: ['Studs', 'Drop', 'Hoop', 'Dangle', 'Clip-on', 'Threader'] },
      { key: 'backType', label: 'Back Type', type: 'select', options: ['Push back', 'Screw back', 'Lever back', 'Fish hook', 'Clip-on', 'Latch back'] },
      { key: 'earringDiameter', label: 'Diameter (mm)', placeholder: 'e.g. 12 (for hoops)' },
    ],
  },
  anklet: {
    label: 'Anklet',
    subcategories: ['Payal', 'Chain Anklet', 'Beaded', 'Charm Anklet'],
    fields: [
      { key: 'ankletLength', label: 'Length', placeholder: 'e.g. 9", 10", 11"' },
      { key: 'closure', label: 'Closure Type', type: 'select', options: ['Lobster clasp', 'Toggle', 'Adjustable', 'Spring ring'] },
    ],
  },
  pendant: {
    label: 'Pendant',
    subcategories: ['Religious', 'Solitaire', 'Locket', 'Name Pendant'],
    fields: [
      { key: 'pendantHeight', label: 'Height (mm)', placeholder: 'e.g. 15' },
      { key: 'pendantWidth', label: 'Width (mm)', placeholder: 'e.g. 10' },
      { key: 'bailType', label: 'Bail Type', placeholder: 'e.g. Loop, Box, Pinch' },
      { key: 'chainIncluded', label: 'Chain Included', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  'bridal set': {
    label: 'Bridal Set',
    subcategories: ['Full Set', 'Half Set', 'Choker Set', 'Necklace + Earrings', 'Maang Tikka'],
    fields: [
      { key: 'setIncludes', label: 'Set Includes', placeholder: 'e.g. Necklace, Earrings, Maang Tikka, Bangles' },
      { key: 'occasion', label: 'Occasion', type: 'select', options: ['Wedding', 'Engagement', 'Reception', 'Festival', 'Multi-occasion'] },
      { key: 'style', label: 'Style', placeholder: 'e.g. Kundan, Polki, Temple, Meenakari' },
    ],
  },
}

export function getPresetForCategory(category) {
  const text = String(category || '').toLowerCase().trim()
  const key = Object.keys(PRESETS).find((k) => text.includes(k))
  return key ? PRESETS[key] : null
}

export function getPresetFieldsForCategory(category) {
  const preset = getPresetForCategory(category)
  return preset ? preset.fields : []
}

export function getSubcategoriesForCategory(category) {
  const preset = getPresetForCategory(category)
  return preset ? preset.subcategories : []
}

export const ALL_CATEGORY_PRESET_KEYS = Object.keys(PRESETS)
