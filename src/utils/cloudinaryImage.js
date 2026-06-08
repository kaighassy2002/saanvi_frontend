/**
 * Normalize product images to a consistent 4:5 frame via Cloudinary delivery transforms.
 * Raw URLs are stored in the database; transforms apply at display time (and on new uploads).
 */

/** Canonical product image aspect ratio (width / height). */
export const PRODUCT_IMAGE_ASPECT = 4 / 5

/** Matches storefront card background (#f8f2e7). */
const PAD_BG = 'f8f2e7'

const PRESETS = {
  card: { width: 640, height: 800, mode: 'pad' },
  gallery: { width: 1200, height: 1500, mode: 'pad' },
  lightbox: { width: 1600, height: 2000, mode: 'pad' },
  thumb: { width: 120, height: 150, mode: 'pad' },
  adminPreview: { width: 400, height: 500, mode: 'pad' },
  hero: { width: 1200, height: 1500, mode: 'fill' },
  category: { width: 400, height: 400, mode: 'fill' },
}

const UPLOAD_MARKER = '/image/upload/'

function buildTransform({ width, height, mode = 'pad' }) {
  if (mode === 'fill') {
    return `c_fill,w_${width},h_${height},g_auto,f_auto,q_auto`
  }
  return `c_pad,w_${width},h_${height},b_rgb:${PAD_BG},f_auto,q_auto`
}

function isCloudinaryImageUrl(url) {
  try {
    const u = new URL(url)
    return u.hostname.includes('res.cloudinary.com') && u.pathname.includes(UPLOAD_MARKER)
  } catch {
    return false
  }
}

function isCloudinaryTransformSegment(segment) {
  if (!segment || /^v\d+$/.test(segment)) return false
  if (!/^[a-z0-9_,]+$/.test(segment)) return false
  return (
    segment.includes(',') ||
    /^(c_|w_|h_|g_|b_|f_|q_|e_|a_|d_|l_|fl_|ar_|t_)/.test(segment)
  )
}

function insertCloudinaryTransform(url, transform) {
  const idx = url.indexOf(UPLOAD_MARKER)
  if (idx === -1) return url

  const prefix = url.slice(0, idx + UPLOAD_MARKER.length)
  const suffix = url.slice(idx + UPLOAD_MARKER.length)
  const parts = suffix.split('/').filter(Boolean)

  let start = 0
  while (start < parts.length && isCloudinaryTransformSegment(parts[start])) {
    start += 1
  }

  const assetPath = parts.slice(start).join('/')
  if (!assetPath) return url

  return `${prefix}${transform}/${assetPath}`
}

/**
 * @param {string} url
 * @param {'card' | 'gallery' | 'lightbox' | 'thumb' | 'adminPreview' | 'hero' | 'category'} [preset]
 * @returns {string}
 */
export function productImageUrl(url, preset = 'card') {
  const trimmed = String(url || '').trim()
  if (!trimmed) return ''
  if (!isCloudinaryImageUrl(trimmed)) return trimmed

  const dims = PRESETS[preset] || PRESETS.card
  return insertCloudinaryTransform(trimmed, buildTransform(dims))
}

/** Transform string included in signed Cloudinary uploads (master asset). */
export function getProductUploadTransform() {
  return buildTransform(PRESETS.gallery)
}
