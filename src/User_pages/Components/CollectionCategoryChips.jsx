import React from 'react'
import { Link } from 'react-router-dom'

function CollectionCategoryChips({
  categories,
  selectedCategory,
  categoryCounts,
  buildCategoryHref,
  className = '',
}) {
  return (
    <div
      className={`collection-category-scroll flex gap-2 overflow-x-auto ${className}`.trim()}
      role="tablist"
      aria-label="Browse by category"
    >
      {categories.map((category) => {
        const active = selectedCategory === category
        return (
          <Link
            key={category}
            to={buildCategoryHref(category)}
            role="tab"
            aria-selected={active}
            className={`shrink-0 rounded-full px-4 py-2.5 font-playfair text-sm whitespace-nowrap transition ${
              active
                ? 'bg-[#7a2c3a] text-white'
                : 'border border-[#e3d1b4] bg-white text-muted hover:border-[#7a2c3a]'
            }`}
          >
            {category}
            <span className={`ml-1.5 text-xs ${active ? 'text-[#f5d8a9]' : 'text-[#9a8577]'}`}>
              ({categoryCounts[category] || 0})
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default CollectionCategoryChips
