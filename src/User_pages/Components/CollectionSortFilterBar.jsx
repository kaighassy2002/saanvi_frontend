import React from 'react'

function CollectionSortFilterBar({ activeFilterCount, onSortClick, onFilterClick }) {
  return (
    <div className="collection-sort-filter-bar">
      <button type="button" onClick={onSortClick} aria-haspopup="dialog">
        <i className="fa-solid fa-arrow-down-wide-short text-muted" aria-hidden />
        Sort
      </button>
      <button type="button" onClick={onFilterClick} aria-haspopup="dialog">
        <i className="fa-solid fa-sliders text-muted" aria-hidden />
        Filter
        {activeFilterCount > 0 ? (
          <span className="relative -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e53935] px-1 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
    </div>
  )
}

export default CollectionSortFilterBar
