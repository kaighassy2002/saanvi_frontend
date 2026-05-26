import { USE_LOCAL_API, STORAGE_KEYS } from './config'
import { jewelleryFetch } from './jewelleryApi'
import {
  localAdminDeleteReview,
  localAdminListReviews,
  localAdminPatchReview,
  localCreateReview,
  localListProductReviews,
  localReviewSummaries,
} from './localReviews'

function localCustomerId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customerProfile)
    if (!raw) return null
    const p = JSON.parse(raw)
    return p?.id ? String(p.id) : 'local-demo'
  } catch {
    return null
  }
}

export async function fetchProductReviews(productId) {
  if (USE_LOCAL_API) {
    return localListProductReviews(productId, localCustomerId())
  }
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  return jewelleryFetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
    auth: false,
    token: token || null,
  })
}

export async function submitProductReview(productId, { rating, title, body }) {
  if (USE_LOCAL_API) {
    const profileRaw = localStorage.getItem(STORAGE_KEYS.customerProfile)
    let name = 'Customer'
    let cid = localCustomerId() || 'guest'
    if (profileRaw) {
      try {
        const p = JSON.parse(profileRaw)
        name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || name
        if (p.id) cid = String(p.id)
      } catch {
        /* ignore */
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.customerToken)) {
      throw new Error('Please sign in to leave a review')
    }
    return localCreateReview({
      productId,
      customerId: cid,
      customerName: name,
      rating,
      title,
      body,
    })
  }
  return jewelleryFetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST',
    body: { rating, title, body },
    auth: 'customer',
  })
}

export async function fetchReviewSummaries(productIds) {
  const ids = [...new Set(productIds.map(String).filter(Boolean))]
  if (!ids.length) return {}
  if (USE_LOCAL_API) {
    return localReviewSummaries(ids)
  }
  const data = await jewelleryFetch(
    `/api/products/reviews/summaries?ids=${encodeURIComponent(ids.join(','))}`
  )
  return data?.summaries && typeof data.summaries === 'object' ? data.summaries : {}
}

export async function adminFetchReviews() {
  if (USE_LOCAL_API) {
    return { reviews: localAdminListReviews() }
  }
  return jewelleryFetch('/api/admin/reviews', { auth: 'admin' })
}

export async function adminPatchReview(id, status) {
  if (USE_LOCAL_API) {
    return localAdminPatchReview(id, status)
  }
  return jewelleryFetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
    auth: 'admin',
  })
}

export async function adminDeleteReview(id) {
  if (USE_LOCAL_API) {
    localAdminDeleteReview(id)
    return null
  }
  return jewelleryFetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: 'admin',
  })
}
