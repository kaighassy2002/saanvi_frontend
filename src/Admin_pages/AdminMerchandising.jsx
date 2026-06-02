import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  getAdminSettings,
  getNewArrivals,
  listProductsAll,
  putAdminSettings,
  putNewArrivals,
} from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import { useAdminToast } from './shared/AdminToastProvider'
import { productImageUrl } from '../utils/cloudinaryImage'

const MAX_NEW = 12
const MAX_FEATURED = 12

function ProductPicker({ items, selectedIds, onToggle, max, label }) {
  return (
    <>
      <p className="text-xs text-muted mb-3">
        {label}: {selectedIds.length} / {max} selected
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No published products.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id)
            const disabled = !selected && selectedIds.length >= max
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => !disabled && onToggle(item.id)}
                className={`lux-card p-3 text-left transition border-2 ${
                  selected
                    ? 'border-gold bg-[#fdf6ee]'
                    : disabled
                      ? 'border-transparent opacity-40 cursor-not-allowed'
                      : 'border-transparent hover:border-[#e8d5c0]'
                }`}
              >
                {item.image ? (
                  <img
                    src={productImageUrl(item.image, 'adminPreview')}
                    alt={item.name}
                    className="mb-2 aspect-[4/5] w-full rounded-md bg-[#f8f2e7] object-contain"
                  />
                ) : (
                  <div className="w-full h-20 bg-[#f4e8db] rounded-md mb-2" />
                )}
                <p className="text-xs font-medium text-ink line-clamp-2">{item.name}</p>
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ids, products, settings] = await Promise.all([
        getNewArrivals(authFetch),
        listProductsAll(authFetch),
        getAdminSettings(authFetch),
      ])
      setNewIds(ids)
      setFeaturedIds(Array.isArray(settings.featuredProductIds) ? settings.featuredProductIds.map(String) : [])
      setHeroSlides(Array.isArray(settings.heroSlides) ? settings.heroSlides : [])
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

  const saveFeaturedAndHero = async () => {
    setSaving(true)
    try {
      const settings = await getAdminSettings(authFetch)
      await putAdminSettings(authFetch, {
        ...settings,
        featuredProductIds: featuredIds,
        heroSlides: heroSlides.filter((s) => s.image || s.title),
      })
      toast('Homepage settings saved.')
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addHeroSlide = () => {
    setHeroSlides((p) => [...p, { image: '', title: '', subtitle: '', link: '' }])
  }

  const updateSlide = (index, field, value) => {
    setHeroSlides((p) => p.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const removeSlide = (index) => {
    setHeroSlides((p) => p.filter((_, i) => i !== index))
  }

  const tabs = [
    { id: 'new', label: 'New arrivals' },
    { id: 'featured', label: 'Featured products' },
    { id: 'hero', label: 'Hero slides' },
  ]

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Merchandising"
        description="Control homepage sections: new arrivals, featured products, and hero carousel."
        action={{
          label: saving ? 'Saving…' : 'Save section',
          onClick: tab === 'new' ? saveNew : saveFeaturedAndHero,
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
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted">Hero carousel slides (image URL, title, subtitle, link).</p>
          {heroSlides.map((slide, index) => (
            <div key={index} className="lux-card p-4 space-y-2">
              <input
                className="w-full rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
                placeholder="Image URL"
                value={slide.image || ''}
                onChange={(e) => updateSlide(index, 'image', e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
                placeholder="Title"
                value={slide.title || ''}
                onChange={(e) => updateSlide(index, 'title', e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
                placeholder="Subtitle"
                value={slide.subtitle || ''}
                onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
                placeholder="Link (e.g. /collections)"
                value={slide.link || ''}
                onChange={(e) => updateSlide(index, 'link', e.target.value)}
              />
              <button type="button" onClick={() => removeSlide(index)} className="text-xs text-red-700">
                Remove slide
              </button>
            </div>
          ))}
          <button type="button" onClick={addHeroSlide} className="text-sm text-muted underline">
            + Add hero slide
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminMerchandising
