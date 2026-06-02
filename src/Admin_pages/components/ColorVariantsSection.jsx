import React from 'react'
import ProductImageUpload from './ProductImageUpload'
import { productImageUrl } from '../../utils/cloudinaryImage'

const ic =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors'

const EMPTY_VARIANT = { name: '', sku: '', price: '', stock: '', imagesMeta: [] }

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">
        {label}
        {hint ? <span className="ml-1 font-normal text-[#9a7a4d]">— {hint}</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
    </div>
  )
}

function variantThumb(variant) {
  const meta = Array.isArray(variant?.imagesMeta) ? variant.imagesMeta : []
  const url = meta[0]?.url || String(variant?.imageUrl || '').trim()
  return url
}

/**
 * Colour variants with a full image gallery per colour (Flipkart-style image sets).
 */
export default function ColorVariantsSection({ form, setField, fieldErrors, authFetch }) {
  const enabled = !!form.hasColorVariants
  const variants = Array.isArray(form.variants) ? form.variants : []

  const setEnabled = (on) => {
    if (on) {
      setField('color', '')
      const existingImages = (Array.isArray(form.imagesMeta) ? form.imagesMeta : []).filter((m) => m?.url)
      if (variants.length === 0) {
        setField('variants', [{ ...EMPTY_VARIANT, imagesMeta: existingImages }])
        if (existingImages.length) setField('imagesMeta', [])
      } else if (existingImages.length > 0) {
        const first = variants[0] || EMPTY_VARIANT
        const firstMeta = Array.isArray(first.imagesMeta) ? first.imagesMeta.filter((m) => m?.url) : []
        if (firstMeta.length === 0) {
          setField(
            'variants',
            variants.map((v, i) => (i === 0 ? { ...v, imagesMeta: existingImages } : v))
          )
          setField('imagesMeta', [])
        }
      }
      setField('hasColorVariants', true)
      return
    }
    setField('hasColorVariants', false)
  }

  const updateVariant = (index, key, value) => {
    setField(
      'variants',
      variants.map((v, i) => (i === index ? { ...v, [key]: value } : v))
    )
  }

  const addColor = () => {
    setField('variants', [...variants, { ...EMPTY_VARIANT }])
  }

  const removeColor = (index) => {
    const next = variants.filter((_, i) => i !== index)
    setField('variants', next)
    if (next.length === 0) setField('hasColorVariants', false)
  }

  return (
    <div id="section-colors" className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
      <div className="border-b border-[#f0e6d6] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-playfair text-sm font-semibold text-ink">Colour variants</p>
            <p className="mt-1 text-[11px] text-muted leading-relaxed">
              One product listing with multiple colours. Upload a separate <strong>image set per colour</strong>.
              The <strong>first colour&apos;s gallery</strong> is used as the shop thumbnail.
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-[#e8d5c0] bg-[#fdfaf6] px-3 py-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-[#7a2c3a]"
            />
            <span className="text-xs font-medium text-ink">Multiple colours</span>
          </label>
        </div>
      </div>

      {enabled ? (
        <div className="space-y-4 px-5 py-5">
          {fieldErrors.colorVariants ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{fieldErrors.colorVariants}</p>
          ) : null}

          {variants.length > 0 ? (
            <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-[#e8d5c0] bg-[#fdfaf6] p-3">
              <span className="w-full text-[10px] font-semibold uppercase tracking-wide text-muted">
                Swatch preview (first image per colour)
              </span>
              {variants.map((v, i) => {
                const label = String(v.name || '').trim() || `Colour ${i + 1}`
                const url = variantThumb(v)
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2 bg-white ${
                        i === 0 ? 'border-[#1f1514]' : 'border-[#d8c4a7]'
                      }`}
                      title={label}
                    >
                      {url ? (
                        <img src={productImageUrl(url, 'thumb')} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="px-1 text-center text-[9px] leading-tight text-muted">{label}</span>
                      )}
                    </div>
                    {i === 0 ? (
                      <span className="text-[9px] font-medium text-[#7a2c3a]">Listing thumb</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="rounded-xl border border-[#e8d5c0] bg-[#fdfaf6] overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-[#e8d5c0] bg-[#f8f2e7] px-4 py-2">
                  <span className="text-xs font-medium text-muted">
                    {index === 0 ? 'Colour 1 (primary — listing images)' : `Colour ${index + 1}`}
                    {variant.name ? `: ${variant.name}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-4 p-4">
                  <Field
                    label="Colour name"
                    error={fieldErrors[`variant-${index}`]}
                    hint="Shown on the product page when this colour is selected"
                  >
                    <input
                      className={ic}
                      value={variant.name}
                      placeholder="e.g. Magenta, Rose Gold, Emerald"
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    />
                  </Field>

                  <div className="rounded-lg border border-[#e8d5c0] bg-white p-3">
                    <ProductImageUpload
                      compact
                      maxImages={8}
                      label={`Image set for ${variant.name?.trim() || `colour ${index + 1}`}`}
                      hint={
                        index === 0
                          ? 'First image here is the shop listing thumbnail. Drag to reorder.'
                          : 'First image is used as the colour swatch on the product page.'
                      }
                      imagesMeta={Array.isArray(variant.imagesMeta) ? variant.imagesMeta : []}
                      authFetch={authFetch}
                      error={fieldErrors[`variant-images-${index}`]}
                      onChange={(next) => {
                        const value =
                          typeof next === 'function'
                            ? next(Array.isArray(variant.imagesMeta) ? variant.imagesMeta : [])
                            : next
                        updateVariant(index, 'imagesMeta', value)
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Stock" hint="Units for this colour">
                      <input
                        type="number"
                        min="0"
                        className={ic}
                        value={variant.stock}
                        placeholder="0"
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      />
                    </Field>
                    <Field label="SKU" hint="Optional">
                      <input
                        className={ic}
                        value={variant.sku}
                        placeholder="Optional"
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      />
                    </Field>
                    <Field label="Price override (₹)" hint="Leave blank = main price">
                      <input
                        type="number"
                        min="0"
                        className={ic}
                        value={variant.price}
                        placeholder="Inherits main price"
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addColor}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d8c4a7] py-3 text-sm text-muted hover:border-gold hover:text-ink transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Add another colour
          </button>
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="text-xs text-muted">
            Single-colour product? Leave this off and upload images under <strong>Images</strong>, with{' '}
            <strong>Colour</strong> in Description &amp; details.
          </p>
        </div>
      )}
    </div>
  )
}
