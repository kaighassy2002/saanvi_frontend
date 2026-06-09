import {
  DEFAULT_HOME_SECTIONS,
  HOME_HERO_SLIDES,
  HOME_PROMO_BANNERS,
  HOME_SERVICES,
} from '../User_pages/data/homeContent'
import { formatInr } from './storefrontConstants'

function slideHasContent(slide) {
  if (!slide || typeof slide !== 'object') return false
  return Boolean(String(slide.image || '').trim() || String(slide.title || '').trim())
}

function bannerHasContent(banner) {
  if (!banner || typeof banner !== 'object') return false
  return Boolean(String(banner.image || '').trim() || String(banner.title || '').trim())
}

function serviceHasContent(service) {
  if (!service || typeof service !== 'object') return false
  return Boolean(String(service.title || '').trim() || String(service.text || '').trim())
}

const EMPTY_HERO_SLIDE = { image: '', tag: '', title: '', subtitle: '', link: '' }
const EMPTY_PROMO_BANNER = { label: '', title: '', image: '', link: '/collections', buttonText: 'Shop now' }
const EMPTY_HOME_SERVICE = { icon: 'fa-paper-plane', title: '', text: '' }

export function applyHomeTemplate(str, { freeShippingThreshold } = {}) {
  if (!str) return ''
  const threshold = formatInr(freeShippingThreshold ?? 0)
  return String(str).replace(/\{\{threshold\}\}/g, threshold)
}

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

export function getDefaultPromoBannersForAdmin() {
  return HOME_PROMO_BANNERS.map((banner) => ({
    label: banner.label || '',
    title: banner.title || '',
    image: banner.image || '',
    link: banner.link || '/collections',
    buttonText: banner.buttonText || 'Shop now',
  }))
}

export function getDefaultHomeServicesForAdmin() {
  return HOME_SERVICES.map((service) => ({ ...service }))
}

export function getDefaultHomeSectionsForAdmin() {
  return JSON.parse(JSON.stringify(DEFAULT_HOME_SECTIONS))
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

export function normalizeAdminPromoBanners(apiBanners) {
  const fromApi = Array.isArray(apiBanners) ? apiBanners.filter(bannerHasContent) : []
  if (fromApi.length > 0) {
    return fromApi.map((banner) => ({
      label: String(banner.label || '').trim(),
      title: String(banner.title || '').trim(),
      image: String(banner.image || '').trim(),
      link: String(banner.link || '').trim() || '/collections',
      buttonText: String(banner.buttonText || '').trim() || 'Shop now',
    }))
  }
  return getDefaultPromoBannersForAdmin()
}

export function normalizeAdminHomeServices(apiServices) {
  const fromApi = Array.isArray(apiServices) ? apiServices.filter(serviceHasContent) : []
  if (fromApi.length > 0) {
    return fromApi.map((service) => ({
      icon: String(service.icon || 'fa-paper-plane').trim() || 'fa-paper-plane',
      title: String(service.title || '').trim(),
      text: String(service.text || '').trim(),
    }))
  }
  return getDefaultHomeServicesForAdmin()
}

export function normalizeAdminHomeSections(apiSections) {
  const base = getDefaultHomeSectionsForAdmin()
  const src = apiSections && typeof apiSections === 'object' ? apiSections : {}
  const merge = (defaults, patch) => ({ ...defaults, ...(patch && typeof patch === 'object' ? patch : {}) })

  const trending = merge(base.trending, src.trending)
  const tabs = Array.isArray(src.trending?.tabs) && src.trending.tabs.length
    ? src.trending.tabs
        .map((t) => ({
          id: ['featured', 'new', 'bestseller'].includes(String(t?.id)) ? String(t.id) : 'featured',
          label: String(t?.label || '').trim(),
        }))
        .filter((t) => t.label)
    : base.trending.tabs

  const quickShop = merge(base.mobileQuickShop, src.mobileQuickShop)
  const chips = Array.isArray(src.mobileQuickShop?.chips)
    ? src.mobileQuickShop.chips
        .map((c) => ({
          label: String(c?.label || '').trim(),
          link: String(c?.link || '').trim() || '/collections',
          highlight: !!c?.highlight,
        }))
        .filter((c) => c.label)
    : base.mobileQuickShop.chips

  return {
    serviceBarStrip: String(src.serviceBarStrip ?? base.serviceBarStrip).trim() || base.serviceBarStrip,
    promo: merge(base.promo, src.promo),
    trending: { ...trending, tabs: tabs.length ? tabs : base.trending.tabs },
    categories: merge(base.categories, src.categories),
    mobilePromos: merge(base.mobilePromos, src.mobilePromos),
    mobileTrending: merge(base.mobileTrending, src.mobileTrending),
    mobileCategories: merge(base.mobileCategories, src.mobileCategories),
    mobileQuickShop: { ...quickShop, chips },
  }
}

export function createEmptyHeroSlide() {
  return { ...EMPTY_HERO_SLIDE }
}

export function createEmptyPromoBanner() {
  return { ...EMPTY_PROMO_BANNER }
}

export function createEmptyHomeService() {
  return { ...EMPTY_HOME_SERVICE }
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

export function resolvePromoBanners(apiBanners, fallbackBanners = HOME_PROMO_BANNERS) {
  const fromApi = Array.isArray(apiBanners) ? apiBanners.filter(bannerHasContent) : []
  const source = fromApi.length > 0 ? fromApi : fallbackBanners

  return source.map((banner) => ({
    label: String(banner.label || '').trim(),
    title: String(banner.title || '').trim(),
    image: String(banner.image || '').trim(),
    link: String(banner.link || '/collections').trim() || '/collections',
    buttonText: String(banner.buttonText || 'Shop now').trim() || 'Shop now',
  }))
}

export function resolveHomeServices(apiServices, fallbackServices = HOME_SERVICES) {
  const fromApi = Array.isArray(apiServices) ? apiServices.filter(serviceHasContent) : []
  const source = fromApi.length > 0 ? fromApi : fallbackServices

  return source.map((service) => ({
    icon: String(service.icon || 'fa-paper-plane').trim() || 'fa-paper-plane',
    title: String(service.title || '').trim(),
    text: String(service.text || '').trim(),
  }))
}

export function resolveHomeSections(apiSections, fallbackSections = DEFAULT_HOME_SECTIONS) {
  const fromApi = apiSections && typeof apiSections === 'object' && Object.keys(apiSections).length > 0
  if (!fromApi) return JSON.parse(JSON.stringify(fallbackSections))
  return normalizeAdminHomeSections(apiSections)
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

export function trendingViewAllHref(activeTab) {
  if (activeTab === 'new') return '/collections?sort=latest'
  if (activeTab === 'bestseller') return '/collections?sort=discount'
  return '/collections'
}

export function mobileTrendingViewAllHref(activeTab) {
  if (activeTab === 'new') return '/collections?sort=latest'
  if (activeTab === 'bestseller') return '/collections?sort=price-high'
  return '/collections'
}
