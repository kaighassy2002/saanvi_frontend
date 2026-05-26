/**
 * Shop category display: API names + optional hero images for nav/home grid.
 */

export const DEFAULT_CATEGORY_IMAGE =
  'https://i.pinimg.com/1200x/37/71/51/3771511e2d33eceb2b37b5c66d993071.jpg'

/** Known category names → marketing images (fallback when API has no image field). */
export const CATEGORY_IMAGES = {
  Necklace: 'https://i.pinimg.com/1200x/37/71/51/3771511e2d33eceb2b37b5c66d993071.jpg',
  'Bridal Set': 'https://i.pinimg.com/736x/05/cb/2a/05cb2a824fa78fffe6e2203d5454fd56.jpg',
  Earrings: 'https://i.pinimg.com/1200x/17/79/74/1779744cf8b937e59ccea81ffd894833.jpg',
  Ring: 'https://i.pinimg.com/1200x/d2/aa/29/d2aa29e9c7f78ff33efec124ca243814.jpg',
  Anklet: 'https://i.pinimg.com/1200x/f4/98/d2/f498d2e89d1f88d4ea2631b61365506c.jpg',
  Matti: 'https://i.pinimg.com/736x/21/80/36/21803675edcabe227827f723378e0da4.jpg',
  'Nose Accessories': 'https://i.pinimg.com/736x/21/c0/ae/21c0ae327b634a9610a1c87ffbf540d7.jpg',
  Bangles: 'https://i.pinimg.com/1200x/d6/f5/d5/d6f5d541fb18a5ada1b3f8537c904250.jpg',
  Bracelets: 'https://i.pinimg.com/1200x/61/8e/86/618e86914fcb22d4ef7199e0874ca8b6.jpg',
  'Hair Accessories': 'https://i.pinimg.com/1200x/d2/7c/9a/d27c9ad94136f2071c2cab135a8ae801.jpg',
}

/** Used when API is unavailable — preserves previous home grid order. */
export const FALLBACK_CATEGORY_NAMES = Object.keys(CATEGORY_IMAGES)

export function imageForCategory(name) {
  const key = String(name || '').trim()
  return CATEGORY_IMAGES[key] || DEFAULT_CATEGORY_IMAGE
}

/**
 * @param {string[]} apiNames - category strings from GET /api/categories
 * @returns {{ name: string, image: string }[]}
 */
export function mergeCategoriesWithImages(apiNames) {
  const names = Array.isArray(apiNames) && apiNames.length > 0 ? apiNames : FALLBACK_CATEGORY_NAMES
  const unique = [...new Set(names.map((n) => String(n).trim()).filter(Boolean))]
  return unique.map((name) => ({
    name,
    image: imageForCategory(name),
  }))
}
