import React from 'react'
import { productImageUrl } from '../../utils/cloudinaryImage'

/**
 * Flipkart-style colour selection: label + thumbnail swatches.
 */
export default function ColorVariantPicker({ options, selectedName, onSelect, label = 'Colour' }) {
  if (!options.length) return null

  const selected = options.find((o) => o.variantName === selectedName)
  const selectedLabel = selected?.label || selectedName

  return (
    <div className="product-detail__color-variants">
      <p className="product-detail__variant-label">
        Selected {label}: <span className="font-medium text-ink">{selectedLabel || '—'}</span>
      </p>
      <div className="product-detail__color-swatches" role="listbox" aria-label={`Select ${label}`}>
        {options.map((option) => {
          const isSelected = option.variantName === selectedName
          const disabled = !option.inStock
          const thumb = option.image
          return (
            <button
              key={option.variantName}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={option.label}
              disabled={disabled}
              title={disabled ? `${option.label} — out of stock` : option.label}
              onClick={() => onSelect(option.variantName)}
              className={`product-detail__color-swatch ${isSelected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
            >
              {thumb ? (
                <img src={productImageUrl(thumb, 'thumb')} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="product-detail__color-swatch-text">{option.label}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
