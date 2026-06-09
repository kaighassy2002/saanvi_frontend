import React, { useState } from 'react'
import { productImageUrl } from '../../utils/cloudinaryImage'
import AdminSingleImageUpload from './AdminSingleImageUpload'
import { createEmptyPromoBanner } from '../../services/homeMerchandising'

const inputClass =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

function PromoBannerForm({ banner, index, authFetch, onChange, onDone }) {
  const update = (field, value) => onChange(index, field, value)

  return (
    <div className="space-y-3 border-t border-[#f0e6d6] pt-4">
      <AdminSingleImageUpload
        imageUrl={banner.image || ''}
        onChange={(url) => update('image', url)}
        authFetch={authFetch}
        purpose="promo"
        label="Banner image"
        hint="Landscape photo works best (3:2)."
      />
      <input
        className={inputClass}
        placeholder="Label (e.g. Flat 30% off)"
        value={banner.label || ''}
        onChange={(e) => update('label', e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Title *"
        value={banner.title || ''}
        onChange={(e) => update('title', e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Link (e.g. /collections?category=Ring)"
        value={banner.link || ''}
        onChange={(e) => update('link', e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Button text"
        value={banner.buttonText || ''}
        onChange={(e) => update('buttonText', e.target.value)}
      />
      <button
        type="button"
        onClick={onDone}
        className="rounded-lg border border-[#d8c4a7] bg-[#fdfaf6] px-3 py-1.5 text-xs font-medium text-ink hover:bg-[#f4e8db]"
      >
        Done editing
      </button>
    </div>
  )
}

function PromoBannersEditor({ banners, onChange, authFetch, usingDefaults }) {
  const [editingIndex, setEditingIndex] = useState(null)

  const updateBanner = (index, field, value) => {
    onChange(banners.map((b, i) => (i === index ? { ...b, [field]: value } : b)))
  }

  const removeBanner = (index) => {
    onChange(banners.filter((_, i) => i !== index))
    setEditingIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
  }

  const moveBanner = (index, direction) => {
    const next = [...banners]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setEditingIndex((prev) => {
      if (prev === index) return target
      if (prev === target) return index
      return prev
    })
  }

  const addBanner = () => {
    const next = [...banners, createEmptyPromoBanner()]
    onChange(next)
    setEditingIndex(next.length - 1)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e8d5c0] bg-[#faf7f2] px-4 py-3">
        <p className="text-xs text-muted">
          {usingDefaults
            ? 'Showing current promo banners (not saved yet). Edit below and click Save section.'
            : `${banners.length} banner${banners.length === 1 ? '' : 's'} saved.`}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Images upload to Cloudinary: <span className="font-mono">Home/Jewellery/promo</span>
        </p>
      </div>

      {banners.length === 0 ? (
        <p className="text-sm text-muted">No promo banners yet.</p>
      ) : (
        <ul className="space-y-3">
          {banners.map((banner, index) => {
            const isEditing = editingIndex === index
            const hasContent = Boolean(banner.image || banner.title)

            return (
              <li key={`promo-${index}`} className="lux-card overflow-hidden">
                <div className="flex gap-3 p-4">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-[#e8d5c0] bg-[#f8f2e7]">
                    {banner.image ? (
                      <img
                        src={productImageUrl(banner.image, 'promo')}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                      Banner {index + 1}
                      {!hasContent ? ' · draft' : ''}
                    </p>
                    {banner.label ? (
                      <p className="mt-0.5 text-[11px] font-medium text-gold-dark">{banner.label}</p>
                    ) : null}
                    <p className="font-medium text-ink line-clamp-1">
                      {banner.title || 'Untitled banner'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingIndex(isEditing ? null : index)}
                      className="rounded-lg border border-[#d8c4a7] px-2.5 py-1 text-xs font-medium text-ink hover:bg-[#fdfaf6]"
                    >
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBanner(index, -1)}
                      className="rounded border border-[#e8d5c0] px-2 py-0.5 text-[10px] text-muted disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === banners.length - 1}
                      onClick={() => moveBanner(index, 1)}
                      className="rounded border border-[#e8d5c0] px-2 py-0.5 text-[10px] text-muted disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <div className="border-t border-[#f0e6d6] px-4 pb-4">
                    <PromoBannerForm
                      banner={banner}
                      index={index}
                      authFetch={authFetch}
                      onChange={updateBanner}
                      onDone={() => setEditingIndex(null)}
                    />
                    <button
                      type="button"
                      onClick={() => removeBanner(index)}
                      className="mt-4 text-xs text-red-700 hover:underline"
                    >
                      Remove this banner
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={addBanner}
        className="rounded-lg border border-dashed border-[#d8c4a7] px-4 py-2.5 text-sm text-muted hover:border-gold hover:text-ink"
      >
        + Add promo banner
      </button>
    </div>
  )
}

export default PromoBannersEditor
