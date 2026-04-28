export function normalizeGoksProduct(item, categoryMap = {}) {
  const category = categoryMap[item.category_id] || 'Other'
  const price =
    item.item_type === 'sale'
      ? item.sale_price || 0
      : item.rental_rate_daily || item.rental_rate_hourly || 0

  return {
    id: item.id,
    name: item.name,
    category,
    price,
    originalPrice: price,
    image: item.image_urls?.[0]?.thumb || item.image_urls?.[0]?.url || '',
    images: (item.image_urls || []).map((e) => e.url),
    description: item.description || '',
    availability: item.availability || 'out_of_stock',
    stock: item.availability === 'out_of_stock' ? 0 : 1,
    published: true,
    item_type: item.item_type,
    rental_rate_daily: item.rental_rate_daily,
    rental_rate_hourly: item.rental_rate_hourly,
    rental_rate_weekly: item.rental_rate_weekly,
    rental_rate_monthly: item.rental_rate_monthly,
    deposit_amount: item.deposit_amount,
    billing_type: item.billing_type,
  }
}
