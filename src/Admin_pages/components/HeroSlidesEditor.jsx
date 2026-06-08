import React, { useState } from 'react'
import { productImageUrl } from '../../utils/cloudinaryImage'
import AdminSingleImageUpload from './AdminSingleImageUpload'
import { createEmptyHeroSlide } from '../../services/homeMerchandising'

const inputClass =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

function HeroSlideForm({ slide, index, authFetch, onChange, onDone }) {
  const update = (field, value) => {
    onChange(index, field, value)
  }

  return (
    <div className="space-y-3 border-t border-[#f0e6d6] pt-4">
      <AdminSingleImageUpload
        imageUrl={slide.image || ''}
        onChange={(url) => update('image', url)}
        authFetch={authFetch}
        purpose="hero"
        label="Hero image"
        hint="Portrait jewellery photo works best (4:5)."
      />
      <input
        className={inputClass}
        placeholder="Overline / tag (e.g. New collection)"
        value={slide.tag || ''}
        onChange={(e) => update('tag', e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Title *"
        value={slide.title || ''}
        onChange={(e) => update('title', e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Subtitle"
        value={slide.subtitle || ''}
        onChange={(e) => update('subtitle', e.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Link (e.g. /collections?category=Earrings)"
        value={slide.link || ''}
        onChange={(e) => update('link', e.target.value)}
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

function HeroSlidesEditor({ slides, onChange, authFetch, usingDefaults }) {
  const [editingIndex, setEditingIndex] = useState(null)

  const updateSlide = (index, field, value) => {
    onChange(slides.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const removeSlide = (index) => {
    onChange(slides.filter((_, i) => i !== index))
    setEditingIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
  }

  const moveSlide = (index, direction) => {
    const next = [...slides]
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

  const addSlide = () => {
    const next = [...slides, createEmptyHeroSlide()]
    onChange(next)
    setEditingIndex(next.length - 1)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e8d5c0] bg-[#faf7f2] px-4 py-3">
        <p className="text-xs text-muted">
          {usingDefaults
            ? 'Showing current homepage hero slides (not saved yet). Edit below and click Save section.'
            : `${slides.length} slide${slides.length === 1 ? '' : 's'} saved. Click Edit to update any slide.`}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Images upload to Cloudinary:{' '}
          <span className="font-mono">Home/Jewellery/hero</span>
        </p>
      </div>

      {slides.length === 0 ? (
        <p className="text-sm text-muted">No hero slides yet.</p>
      ) : (
        <ul className="space-y-3">
          {slides.map((slide, index) => {
            const isEditing = editingIndex === index
            const hasContent = Boolean(slide.image || slide.title)

            return (
              <li key={`hero-slide-${index}`} className="lux-card overflow-hidden">
                <div className="flex gap-3 p-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[#e8d5c0] bg-[#f8f2e7]">
                    {slide.image ? (
                      <img
                        src={productImageUrl(slide.image, 'hero')}
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
                      Slide {index + 1}
                      {!hasContent ? ' · draft' : ''}
                    </p>
                    {slide.tag ? (
                      <p className="mt-0.5 text-[11px] font-medium text-gold-dark">{slide.tag}</p>
                    ) : null}
                    <p className="font-medium text-ink line-clamp-1">
                      {slide.title || 'Untitled slide'}
                    </p>
                    {slide.subtitle ? (
                      <p className="text-xs text-muted line-clamp-1">{slide.subtitle}</p>
                    ) : null}
                    {slide.link ? (
                      <p className="mt-1 truncate font-mono text-[10px] text-muted">{slide.link}</p>
                    ) : null}
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
                      onClick={() => moveSlide(index, -1)}
                      className="rounded border border-[#e8d5c0] px-2 py-0.5 text-[10px] text-muted disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === slides.length - 1}
                      onClick={() => moveSlide(index, 1)}
                      className="rounded border border-[#e8d5c0] px-2 py-0.5 text-[10px] text-muted disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="border-t border-[#f0e6d6] px-4 pb-4">
                    <HeroSlideForm
                      slide={slide}
                      index={index}
                      authFetch={authFetch}
                      onChange={updateSlide}
                      onDone={() => setEditingIndex(null)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlide(index)}
                      className="mt-4 text-xs text-red-700 hover:underline"
                    >
                      Remove this slide
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
        onClick={addSlide}
        className="rounded-lg border border-dashed border-[#d8c4a7] px-4 py-2.5 text-sm text-muted hover:border-gold hover:text-ink"
      >
        + Add hero slide
      </button>
    </div>
  )
}

export default HeroSlidesEditor
