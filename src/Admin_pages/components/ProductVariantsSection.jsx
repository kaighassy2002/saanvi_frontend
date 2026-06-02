import React, { useMemo } from 'react'
import ProductImageUpload from './ProductImageUpload'
import { productImageUrl } from '../../utils/cloudinaryImage'
import { EMPTY_COLOR_ROW, parseSizesInput } from '../../services/variantMatrixForm'

const ic =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors'

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

function colorThumb(row) {
  const meta = Array.isArray(row?.imagesMeta) ? row.imagesMeta : []
  return meta[0]?.url || ''
}

/**
 * Professional colour × size variant editor with per-cell stock.
 */
export default function ProductVariantsSection({ form, setField, fieldErrors, authFetch }) {
  const enabled = !!form.hasVariants
  const sizes = useMemo(() => parseSizesInput(form.variantSizes), [form.variantSizes])
  const colorMatrix = Array.isArray(form.colorMatrix) ? form.colorMatrix : []

  const setEnabled = (on) => {
    if (on) {
      setField('color', '')
      setField('sizeOptions', '')
      const existingImages = (Array.isArray(form.imagesMeta) ? form.imagesMeta : []).filter((m) => m?.url)
      const matrix = Array.isArray(form.colorMatrix) ? form.colorMatrix : []
      if (matrix.length === 0) {
        setField('colorMatrix', [{ ...EMPTY_COLOR_ROW(), imagesMeta: existingImages }])
        if (existingImages.length) setField('imagesMeta', [])
      }
      setField('hasVariants', true)
      return
    }
    setField('hasVariants', false)
  }

  const updateMatrix = (next) => setField('colorMatrix', next)

  const updateColorRow = (index, patch) => {
    updateMatrix(colorMatrix.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const updateStock = (colorIndex, size, value) => {
    const row = colorMatrix[colorIndex] || EMPTY_COLOR_ROW()
    const stocks = { ...(row.stocks || {}), [size]: value }
    updateColorRow(colorIndex, { stocks })
  }

  const addColor = () => updateMatrix([...colorMatrix, EMPTY_COLOR_ROW()])

  const removeColor = (index) => {
    const next = colorMatrix.filter((_, i) => i !== index)
    updateMatrix(next)
    if (next.length === 0) setField('hasVariants', false)
  }

  const addSizeColumn = (sizeLabel) => {
    const label = String(sizeLabel || '').trim()
    if (!label || sizes.includes(label)) return
    setField('variantSizes', [...sizes, label].join(', '))
  }

  const removeSizeColumn = (sizeLabel) => {
    const nextSizes = sizes.filter((s) => s !== sizeLabel)
    setField(
      'variantSizes',
      nextSizes.join(', ')
    )
    updateMatrix(
      colorMatrix.map((row) => {
        const stocks = { ...(row.stocks || {}) }
        delete stocks[sizeLabel]
        return { ...row, stocks }
      })
    )
  }

  return (
    <div id="section-colors" className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
      <div className="border-b border-[#f0e6d6] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-playfair text-sm font-semibold text-ink">Variants (colour &amp; size)</p>
            <p className="mt-1 text-[11px] text-muted leading-relaxed">
              Shared product details apply to all variants. Set <strong>stock per colour and size</strong>.
              First colour&apos;s images are used for shop listings.
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-[#e8d5c0] bg-[#fdfaf6] px-3 py-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-[#7a2c3a]"
            />
            <span className="text-xs font-medium text-ink">Use variants</span>
          </label>
        </div>
      </div>

      {enabled ? (
        <div className="space-y-5 px-5 py-5">
          {fieldErrors.variants ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{fieldErrors.variants}</p>
          ) : null}

          <Field
            label="Sizes"
            hint="Comma-separated — columns in the stock table (e.g. 2.2, 2.4, 2.6 or 6, 7, 8)"
            error={fieldErrors.variantSizes}
          >
            <input
              className={ic}
              value={form.variantSizes || ''}
              placeholder="e.g. 2.2, 2.4, 2.6"
              onChange={(e) => setField('variantSizes', e.target.value)}
            />
            {sizes.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d8c4a7] bg-[#fdfaf6] px-2 py-0.5 text-[11px]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSizeColumn(s)}
                      className="text-muted hover:text-red-600"
                      aria-label={`Remove size ${s}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </Field>

          {colorMatrix.length > 0 ? (
            <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-[#e8d5c0] bg-[#fdfaf6] p-3">
              <span className="w-full text-[10px] font-semibold uppercase tracking-wide text-muted">
                Colour swatches
              </span>
              {colorMatrix.map((row, i) => {
                const label = String(row.colorName || '').trim() || `Colour ${i + 1}`
                const url = colorThumb(row)
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-12 w-12 overflow-hidden rounded-lg border-2 bg-white ${
                        i === 0 ? 'border-[#1f1514]' : 'border-[#d8c4a7]'
                      }`}
                      title={label}
                    >
                      {url ? (
                        <img src={productImageUrl(url, 'thumb')} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center px-0.5 text-center text-[8px] text-muted">
                          {label}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          <div className="space-y-4">
            {colorMatrix.map((row, colorIndex) => (
              <div key={colorIndex} className="rounded-xl border border-[#e8d5c0] bg-[#fdfaf6] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#e8d5c0] bg-[#f8f2e7] px-4 py-2">
                  <span className="text-xs font-medium text-muted">
                    {colorIndex === 0 ? 'Colour 1 (listing images)' : `Colour ${colorIndex + 1}`}
                    {row.colorName ? `: ${row.colorName}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeColor(colorIndex)}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Remove colour
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  <Field label="Colour name" error={fieldErrors[`color-${colorIndex}`]}>
                    <input
                      className={ic}
                      value={row.colorName || ''}
                      placeholder="e.g. Magenta, Rose Gold"
                      onChange={(e) => updateColorRow(colorIndex, { colorName: e.target.value })}
                    />
                  </Field>

                  <div className="rounded-lg border border-[#e8d5c0] bg-white p-3">
                    <ProductImageUpload
                      compact
                      maxImages={8}
                      label="Images for this colour"
                      hint="Shown when customer selects this colour"
                      imagesMeta={Array.isArray(row.imagesMeta) ? row.imagesMeta : []}
                      authFetch={authFetch}
                      error={fieldErrors[`color-images-${colorIndex}`]}
                      onChange={(next) => {
                        const value =
                          typeof next === 'function'
                            ? next(Array.isArray(row.imagesMeta) ? row.imagesMeta : [])
                            : next
                        updateColorRow(colorIndex, { imagesMeta: value })
                      }}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">Stock by size</p>
                    {sizes.length === 0 ? (
                      <Field label="Stock" hint="Add sizes above for a full matrix, or enter total stock here">
                        <input
                          type="number"
                          min="0"
                          className={ic}
                          value={row.stocks?.[''] ?? ''}
                          placeholder="0"
                          onChange={(e) => updateStock(colorIndex, '', e.target.value)}
                        />
                      </Field>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-[#e8d5c0]">
                        <table className="w-full min-w-[280px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-[#e8d5c0] bg-[#f8f2e7]">
                              <th className="px-3 py-2 font-medium text-muted">Size</th>
                              {sizes.map((size) => (
                                <th key={size} className="px-3 py-2 font-medium text-ink">
                                  {size}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-3 py-2 text-muted">Units</td>
                              {sizes.map((size) => (
                                <td key={size} className="px-2 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    className={`${ic} !py-1.5 text-center`}
                                    value={row.stocks?.[size] ?? ''}
                                    placeholder="0"
                                    onChange={(e) => updateStock(colorIndex, size, e.target.value)}
                                  />
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
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
            Add colour
          </button>

          <p className="text-[11px] text-muted">
            Total variant stock is summed for inventory. Set main product stock to <strong>0</strong> when using
            only the matrix.
          </p>
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="text-xs text-muted">
            Simple product? Leave this off and use <strong>Images</strong> plus optional{' '}
            <strong>Colour</strong> in Details.
          </p>
        </div>
      )}
    </div>
  )
}
