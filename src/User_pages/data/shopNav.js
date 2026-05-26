/** Shared shop navigation links — category names/images come from useShopCategories / shopCategories.js */

export const SHOP_QUICK_LINKS = [
  { label: 'All collections', to: '/collections' },
  { label: 'New arrivals', to: '/collections?sort=latest' },
  { label: 'Bridal edit', to: '/collections?category=Bridal%20Set' },
  { label: 'Contact', to: '/contact' },
]

export function categoryCollectionHref(name) {
  return `/collections?category=${encodeURIComponent(name)}`
}
