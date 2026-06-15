/** Products with the highest discount % — used for mobile best-seller strip. */
export function getBestSellerProducts(products, limit = 6) {
  return [...(Array.isArray(products) ? products : [])]
    .sort((a, b) => {
      const da =
        a.originalPrice > a.price && a.originalPrice > 0
          ? (a.originalPrice - a.price) / a.originalPrice
          : 0
      const db =
        b.originalPrice > b.price && b.originalPrice > 0
          ? (b.originalPrice - b.price) / b.originalPrice
          : 0
      return db - da
    })
    .slice(0, limit)
}
