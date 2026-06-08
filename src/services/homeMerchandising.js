import { HOME_HERO_SLIDES } from '../User_pages/data/homeContent'

function slideHasContent(slide) {
  if (!slide || typeof slide !== 'object') return false
  return Boolean(String(slide.image || '').trim() || String(slide.title || '').trim())
}

const EMPTY_HERO_SLIDE = { image: '', tag: '', title: '', subtitle: '', link: '' }

/** Default slides for admin when none saved yet (matches storefront fallbacks). */
export function getDefaultHeroSlidesForAdmin() {
  return HOME_HERO_SLIDES.map((slide) => ({
    image: slide.image || '',
    tag: slide.tag || '',
    title: slide.title || '',
    subtitle: slide.subtitle || '',
    link: slide.link || '/collections',
  }))
}

/** Load hero slides in admin — use saved slides or editable defaults. */
export function normalizeAdminHeroSlides(apiSlides) {
  const fromApi = Array.isArray(apiSlides) ? apiSlides.filter(slideHasContent) : []
  if (fromApi.length > 0) {
    return fromApi.map((slide) => ({
      image: String(slide.image || '').trim(),
      tag: String(slide.tag || '').trim(),
      title: String(slide.title || '').trim(),
      subtitle: String(slide.subtitle || '').trim(),
      link: String(slide.link || '').trim() || '/collections',
    }))
  }
  return getDefaultHeroSlidesForAdmin()
}

export function createEmptyHeroSlide() {
  return { ...EMPTY_HERO_SLIDE }
}

/** Use admin slides when at least one has image or title; otherwise fallback. */
export function resolveHeroSlides(apiSlides, fallbackSlides = HOME_HERO_SLIDES) {
  const fromApi = Array.isArray(apiSlides) ? apiSlides.filter(slideHasContent) : []
  const source = fromApi.length > 0 ? fromApi : fallbackSlides

  return source.map((slide) => ({
    tag: String(slide.tag || '').trim(),
    title: String(slide.title || '').trim(),
    subtitle: String(slide.subtitle || '').trim(),
    image: String(slide.image || '').trim(),
    link: String(slide.link || '/collections').trim() || '/collections',
  }))
}

/** Resolve featured products by admin order; fallback to first N catalog items. */
export function resolveFeaturedProducts(products, featuredIds, limit = 10) {
  const catalog = Array.isArray(products) ? products : []
  const ids = Array.isArray(featuredIds)
    ? featuredIds.map(String).filter(Boolean)
    : []

  if (ids.length > 0) {
    const byId = new Map(catalog.map((p) => [String(p.id), p]))
    const picked = ids.map((id) => byId.get(id)).filter(Boolean)
    if (picked.length > 0) return picked.slice(0, limit)
  }

  return catalog.slice(0, limit)
}
