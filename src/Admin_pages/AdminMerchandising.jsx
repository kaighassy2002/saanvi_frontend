import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  getAdminSettings,
  getCategories,
  getNewArrivals,
  listCatalogCategories,
  listProductsAll,
  putAdminSettings,
  putNewArrivals,
} from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import { useAdminToast } from './shared/AdminToastProvider'
import { productImageUrl } from '../utils/cloudinaryImage'
import HeroSlidesEditor from './components/HeroSlidesEditor'
import HomePopularCategoriesEditor from './components/HomePopularCategoriesEditor'
import PromoBannersEditor from './components/PromoBannersEditor'
import HomeServicesEditor from './components/HomeServicesEditor'
import HomeSectionsEditor from './components/HomeSectionsEditor'
import {
  normalizeAdminHeroSlides,
  normalizeAdminPromoBanners,
  normalizeAdminHomeServices,
  normalizeAdminHomeSections,
} from '../services/homeMerchandising'
import { buildHomeCategoryTilesForAdmin } from '../services/shopCategories'

const MAX_NEW = 12
const MAX_FEATURED = 12

function hasSavedContent(items, fields) {
  return Array.isArray(items) && items.some((item) => fields.some((f) => String(item?.[f] || '').trim()))
}

function ProductPicker({ items, selectedIds, onToggle, max, label }) {
  return (
    <>
      <p className="text-xs text-muted mb-3">
        {label}: {selectedIds.length} / {max} selected
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No published products.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id)
            const disabled = !selected && selectedIds.length >= max
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => !disabled && onToggle(item.id)}
                className={`lux-card p-2 text-left transition border-2 ${
                  selected
                    ? 'border-gold bg-[#fdf6ee]'
                    : disabled
                      ? 'border-transparent opacity-40 cursor-not-allowed'
                      : 'border-transparent hover:border-[#e8d5c0]'
                }`}
              >
                {item.image ? (
                  <img
                    src={productImageUrl(item.image, 'thumb')}
                    alt={item.name}
                    className="mb-1.5 aspect-[4/5] w-full max-h-24 rounded-md bg-[#f8f2e7] object-contain"
                  />
                ) : (
                  <div className="mb-1.5 h-16 w-full rounded-md bg-[#f4e8db]" />
                )}
                <p className="text-[10px] font-medium leading-snug text-ink line-clamp-2 sm:text-xs">
                  {item.name}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

function AdminMerchandising() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [tab, setTab] = useState('new')
  const [allItems, setAllItems] = useState([])
  const [newIds, setNewIds] = useState([])
  const [featuredIds, setFeaturedIds] = useState([])
  const [heroSlides, setHeroSlides] = useState([])
  const [heroUsingDefaults, setHeroUsingDefaults] = useState(false)
  const [promoBanners, setPromoBanners] = useState([])
  const [promoUsingDefaults, setPromoUsingDefaults] = useState(false)
  const [homeServices, setHomeServices] = useState([])
  const [servicesUsingDefaults, setServicesUsingDefaults] = useState(false)
  const [homeSections, setHomeSections] = useState({})
  const [categoryTiles, setCategoryTiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ids, products, settings, shopNames, catalogCategories] = await Promise.all([
        getNewArrivals(authFetch),
        listProductsAll(authFetch),
        getAdminSettings(authFetch),
        getCategories(authFetch),
        listCatalogCategories(authFetch),
      ])
      setNewIds(ids)
      setFeaturedIds(Array.isArray(settings.featuredProductIds) ? settings.featuredProductIds.map(String) : [])

      const savedHero = Array.isArray(settings.heroSlides) ? settings.heroSlides : []
      setHeroSlides(normalizeAdminHeroSlides(savedHero))
      setHeroUsingDefaults(!hasSavedContent(savedHero, ['image', 'title']))

      const savedPromo = Array.isArray(settings.promoBanners) ? settings.promoBanners : []
      setPromoBanners(normalizeAdminPromoBanners(savedPromo))
      setPromoUsingDefaults(!hasSavedContent(savedPromo, ['image', 'title']))

      const savedServices = Array.isArray(settings.homeServices) ? settings.homeServices : []
      setHomeServices(normalizeAdminHomeServices(savedServices))
      setServicesUsingDefaults(!hasSavedContent(savedServices, ['title', 'text']))

      setHomeSections(normalizeAdminHomeSections(settings.homeSections))

      setCategoryTiles(
        buildHomeCategoryTilesForAdmin(
          Array.isArray(shopNames) ? shopNames : [],
          Array.isArray(catalogCategories) ? catalogCategories : [],
          settings.homeCategoryImages || []
        )
      )
      setAllItems(products.filter((p) => p.published !== false))
    } catch (err) {
      setError(err?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const toggleId = (setter, max) => (id) => {
    setter((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= max) return prev
      return [...prev, id]
    })
  }

  const saveNew = async () => {
    setSaving(true)
    try {
      await putNewArrivals(authFetch, newIds)
      toast('New arrivals saved.')
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveHomeCategories = async () => {
    setSaving(true)
    try {
      const settings = await getAdminSettings(authFetch)
      await putAdminSettings(authFetch, {
        ...settings,
        homeCategoryImages: categoryTiles
          .filter((tile) => tile.name && String(tile.image || '').trim())
          .map((tile) => ({
            name: String(tile.name).trim(),
            image: String(tile.image).trim(),
          })),
      })
      toast('Popular category images saved.')
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveFeaturedAndHero = async () => {
    setSaving(true)
    try {
      const settings = await getAdminSettings(authFetch)
      await putAdminSettings(authFetch, {
        ...settings,
        featuredProductIds: featuredIds,
        heroSlides: heroSlides.filter((s) => s.image || s.title),
      })
      setHeroUsingDefaults(false)
      toast('Featured products and hero slides saved.')
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const savePromoBanners = async () => {
    setSaving(true)
    try {
      const settings = await getAdminSettings(authFetch)
      await putAdminSettings(authFetch, {
        ...settings,
        promoBanners: promoBanners.filter((b) => b.image || b.title),
      })
      setPromoUsingDefaults(false)
      toast('Promo banners saved.')
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveHomeServices = async () => {
    setSaving(true)
    try {
      const settings = await getAdminSettings(authFetch)
      await putAdminSettings(authFetch, {
        ...settings,
        homeServices: homeServices.filter((s) => s.title || s.text),
      })
      setServicesUsingDefaults(false)
      toast('Service cards saved.')
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveHomeSections = async () => {
    setSaving(true)
    try {
      const settings = await getAdminSettings(authFetch)
      await putAdminSettings(authFetch, {
        ...settings,
        homeSections,
      })
      toast('Section copy saved.')
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'new', label: 'New arrivals' },
    { id: 'featured', label: 'Featured products' },
    { id: 'hero', label: 'Hero slides' },
    { id: 'promo', label: 'Promo banners' },
    { id: 'services', label: 'Service bar' },
    { id: 'sections', label: 'Section copy' },
    { id: 'categories', label: 'Popular categories' },
  ]

  const saveSection =
    tab === 'new'
      ? saveNew
      : tab === 'categories'
        ? saveHomeCategories
        : tab === 'promo'
          ? savePromoBanners
          : tab === 'services'
            ? saveHomeServices
            : tab === 'sections'
              ? saveHomeSections
              : saveFeaturedAndHero

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Merchandising"
        description="Control all homepage sections: products, hero, promos, services, copy, and category images. Images upload to Cloudinary; content saves to MongoDB."
        action={{
          label: saving ? 'Saving…' : 'Save section',
          onClick: saveSection,
        }}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-xs ${
              tab === t.id ? 'bg-[#f4e8db] font-medium' : 'border border-[#e8d5c0]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : tab === 'new' ? (
        <ProductPicker
          items={allItems}
          selectedIds={newIds}
          onToggle={toggleId(setNewIds, MAX_NEW)}
          max={MAX_NEW}
          label="New arrivals"
        />
      ) : tab === 'featured' ? (
        <ProductPicker
          items={allItems}
          selectedIds={featuredIds}
          onToggle={toggleId(setFeaturedIds, MAX_FEATURED)}
          max={MAX_FEATURED}
          label="Featured products"
        />
      ) : tab === 'hero' ? (
        <HeroSlidesEditor
          slides={heroSlides}
          onChange={setHeroSlides}
          authFetch={authFetch}
          usingDefaults={heroUsingDefaults}
        />
      ) : tab === 'promo' ? (
        <PromoBannersEditor
          banners={promoBanners}
          onChange={setPromoBanners}
          authFetch={authFetch}
          usingDefaults={promoUsingDefaults}
        />
      ) : tab === 'services' ? (
        <HomeServicesEditor
          services={homeServices}
          onChange={setHomeServices}
          usingDefaults={servicesUsingDefaults}
        />
      ) : tab === 'sections' ? (
        <HomeSectionsEditor sections={homeSections} onChange={setHomeSections} />
      ) : (
        <HomePopularCategoriesEditor
          tiles={categoryTiles}
          onChange={setCategoryTiles}
          authFetch={authFetch}
        />
      )}
    </div>
  )
}

export default AdminMerchandising
