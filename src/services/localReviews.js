import { REVIEWS_UPDATED_EVENT, STORAGE_KEYS } from './config'
import { localCustomerPurchasedProduct } from './localOrders'

function emitReviewsUpdated() {
  window.dispatchEvent(new Event(REVIEWS_UPDATED_EVENT))
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.reviews)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(list))
  emitReviewsUpdated()
}

function computeSummary(reviews) {
  const approved = reviews.filter((r) => r.status === 'approved')
  if (!approved.length) return { average: 0, count: 0 }
  const sum = approved.reduce((s, r) => s + Number(r.rating || 0), 0)
  return {
    average: Math.round((sum / approved.length) * 10) / 10,
    count: approved.length,
  }
}

export function localListProductReviews(productId, customerId = null) {
  const all = readAll().filter((r) => String(r.productId) === String(productId))
  const reviews = all
    .filter((r) => r.status === 'approved')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const myReview = customerId
    ? all.find((r) => String(r.customerId) === String(customerId)) || null
    : null
  const hasPurchased = customerId ? localCustomerPurchasedProduct(productId) : false
  const canReview = Boolean(customerId && hasPurchased && !myReview)
  return { reviews, summary: computeSummary(all), myReview, hasPurchased, canReview }
}

export function localReviewSummaries(productIds) {
  const all = readAll()
  const summaries = {}
  for (const id of productIds) {
    const pid = String(id)
    const list = all.filter((r) => String(r.productId) === pid)
    summaries[pid] = computeSummary(list)
  }
  return summaries
}

export function localCreateReview({ productId, customerId, customerName, rating, title, body }) {
  if (!localCustomerPurchasedProduct(productId)) {
    throw new Error('Only customers who purchased this product can leave a review.')
  }
  const all = readAll()
  if (all.some((r) => String(r.productId) === String(productId) && String(r.customerId) === String(customerId))) {
    throw new Error('You have already reviewed this product')
  }
  const review = {
    id: `rev-${Date.now()}`,
    productId: String(productId),
    customerId: String(customerId),
    customerName: customerName || 'Customer',
    rating: Number(rating),
    title: String(title || '').trim(),
    body: String(body || '').trim(),
    status: 'approved',
    createdAt: new Date().toISOString(),
  }
  writeAll([review, ...all])
  return { review, message: 'Thank you! Your review has been published.' }
}

export function localAdminListReviews() {
  return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function localAdminPatchReview(id, status) {
  const all = readAll()
  const idx = all.findIndex((r) => String(r.id) === String(id))
  if (idx < 0) throw new Error('Review not found')
  all[idx] = { ...all[idx], status }
  writeAll(all)
  return all[idx]
}

export function localAdminDeleteReview(id) {
  writeAll(readAll().filter((r) => String(r.id) !== String(id)))
}
