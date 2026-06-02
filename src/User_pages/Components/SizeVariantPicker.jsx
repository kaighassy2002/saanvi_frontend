import React from 'react'

export default function SizeVariantPicker({ sizes, selectedSize, onSelect }) {
  if (!sizes.length) return null

  return (
    <div className="product-detail__size-variants">
      <p className="product-detail__variant-label">
        Selected size: <span className="font-medium text-ink">{selectedSize || '—'}</span>
      </p>
      <div className="product-detail__size-options" role="listbox" aria-label="Select size">
        {sizes.map((row) => {
          const value = typeof row === 'string' ? row : row.size
          const label = typeof row === 'string' ? row : row.label || row.size
          const disabled = typeof row === 'object' && row.inStock === false
          const selected = value === selectedSize
          return (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={disabled}
              title={disabled ? 'Out of stock' : undefined}
              onClick={() => onSelect(value)}
              className={`product-detail__size-option ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
