import React from 'react'

function FilterFacetList({ label, options, selected, onToggle, isSidebar }) {
  if (!options.length) return null

  return (
    <div className={isSidebar ? 'collection-myntra__filter-section' : undefined}>
      <h3 className={isSidebar ? 'collection-myntra__filter-label' : 'font-bodoni text-lg text-ink'}>
        {label}
      </h3>
      <div
        className={isSidebar ? 'collection-myntra__filter-list' : 'mt-3 space-y-1.5'}
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const checked = selected.includes(option.value)
          if (isSidebar) {
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggle(option.value)}
                className={`collection-myntra__filter-option w-full ${checked ? 'is-selected' : ''}`}
              >
                <span className="collection-myntra__checkbox" aria-hidden>
                  {checked ? <i className="fa-solid fa-check text-[10px]" /> : null}
                </span>
                <span className="collection-myntra__filter-option-label">{option.value}</span>
                <span className="collection-myntra__filter-option-count">({option.count})</span>
              </button>
            )
          }
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3 py-2.5 text-left font-playfair text-sm transition ${
                checked
                  ? 'bg-[#f5ead7] font-medium text-[#7a2c3a]'
                  : 'text-muted hover:bg-[#faf5ec] hover:text-[#7a2c3a]'
              }`}
            >
              <span>{option.value}</span>
              <span className="text-xs text-[#9a8577]">({option.count})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CollectionFilters({
  availability,
  setAvailability,
  productsCount,
  inStockCount,
  outOfStockCount,
  priceBounds,
  priceRange,
  setPriceRange,
  colorOptions = [],
  selectedColors = [],
  onColorToggle,
  materialOptions = [],
  selectedMaterials = [],
  onMaterialToggle,
  variant = 'default',
}) {
  const priceDisabled = priceBounds.max <= priceBounds.min
  const isSidebar = variant === 'sidebar'

  const availabilityOptions = [
    { value: 'all', label: 'All products', count: productsCount },
    { value: 'in-stock', label: 'In stock', count: inStockCount },
    { value: 'out-stock', label: 'Out of stock', count: outOfStockCount },
  ]

  const applyPriceMin = (value) => {
    const min = Math.min(Number(value), priceRange.max)
    setPriceRange({ min, max: priceRange.max })
  }

  const applyPriceMax = (value) => {
    const max = Math.max(Number(value), priceRange.min)
    setPriceRange({ min: priceRange.min, max })
  }

  return (
    <div className={isSidebar ? 'collection-myntra__filter-sections' : 'space-y-6'}>
      <div className={isSidebar ? 'collection-myntra__filter-section' : undefined}>
        <h3 className={isSidebar ? 'collection-myntra__filter-label' : 'font-bodoni text-lg text-ink'}>
          {isSidebar ? 'PRICE' : 'Price range'}
        </h3>
        {!isSidebar ? (
          <p className="mt-1 font-playfair text-xs text-muted">Drag to refine results</p>
        ) : null}
        <div className={isSidebar ? 'collection-myntra__price-sliders' : 'mt-4 space-y-4'}>
          <label className="block font-playfair text-xs text-[#696e79]">
            {isSidebar ? `Min — ₹${priceRange.min.toLocaleString()}` : `Minimum — ₹${priceRange.min.toLocaleString()}`}
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceRange.min}
              disabled={priceDisabled}
              onChange={(e) => applyPriceMin(e.target.value)}
              className="collection-range mt-2 w-full"
            />
          </label>
          <label className="block font-playfair text-xs text-[#696e79]">
            {isSidebar ? `Max — ₹${priceRange.max.toLocaleString()}` : `Maximum — ₹${priceRange.max.toLocaleString()}`}
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceRange.max}
              disabled={priceDisabled}
              onChange={(e) => applyPriceMax(e.target.value)}
              className="collection-range mt-2 w-full"
            />
          </label>
        </div>
        {isSidebar && !priceDisabled ? (
          <p className="collection-myntra__price-summary">
            ₹{priceRange.min.toLocaleString()} – ₹{priceRange.max.toLocaleString()}
          </p>
        ) : null}
      </div>

      <FilterFacetList
        label={isSidebar ? 'COLOUR' : 'Colour'}
        options={colorOptions}
        selected={selectedColors}
        onToggle={onColorToggle}
        isSidebar={isSidebar}
      />

      <FilterFacetList
        label={isSidebar ? 'MATERIAL' : 'Material'}
        options={materialOptions}
        selected={selectedMaterials}
        onToggle={onMaterialToggle}
        isSidebar={isSidebar}
      />

      <div className={isSidebar ? 'collection-myntra__filter-section' : undefined}>
        <h3 className={isSidebar ? 'collection-myntra__filter-label' : 'font-bodoni text-lg text-ink'}>
          {isSidebar ? 'AVAILABILITY' : 'Availability'}
        </h3>
        <div
          className={isSidebar ? 'collection-myntra__filter-list' : 'mt-3 space-y-1.5'}
          role="group"
          aria-label="Filter by availability"
        >
          {availabilityOptions.map((option) =>
            isSidebar ? (
              <button
                key={option.value}
                type="button"
                onClick={() => setAvailability(option.value)}
                className={`collection-myntra__filter-option w-full ${
                  availability === option.value ? 'is-selected' : ''
                }`}
              >
                <span className="collection-myntra__checkbox" aria-hidden>
                  {availability === option.value ? (
                    <i className="fa-solid fa-check text-[10px]" />
                  ) : null}
                </span>
                <span className="collection-myntra__filter-option-label">{option.label}</span>
                <span className="collection-myntra__filter-option-count">({option.count})</span>
              </button>
            ) : (
              <button
                key={option.value}
                type="button"
                onClick={() => setAvailability(option.value)}
                className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3 py-2.5 text-left font-playfair text-sm transition ${
                  availability === option.value
                    ? 'bg-[#f5ead7] font-medium text-[#7a2c3a]'
                    : 'text-muted hover:bg-[#faf5ec] hover:text-[#7a2c3a]'
                }`}
              >
                <span>{option.label}</span>
                <span className="text-xs text-[#9a8577]">({option.count})</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default CollectionFilters
