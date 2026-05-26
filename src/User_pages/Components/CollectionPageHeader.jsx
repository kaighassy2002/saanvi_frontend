import React from 'react'
import { getCategoryBlurb } from '../data/categoryCopy'

function CollectionPageHeader({ title, productCount, loading, selectedCategory }) {
  const blurb = getCategoryBlurb(selectedCategory)

  return (
    <header className="mb-4 lg:hidden">
      <h1 className="font-bodoni text-2xl leading-tight text-ink">{title}</h1>
      <p className="mt-1 font-playfair text-sm text-muted">
        {loading ? 'Curating pieces for you…' : `${productCount} pieces to explore`}
      </p>
      <p className="mt-2 text-helper text-sm leading-relaxed">{blurb}</p>
    </header>
  )
}

export default CollectionPageHeader
