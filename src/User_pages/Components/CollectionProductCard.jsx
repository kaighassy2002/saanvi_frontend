import React from 'react'
import StoreProductCard from './StoreProductCard'

function CollectionProductCard({ compact = false, ...props }) {
  return <StoreProductCard {...props} variant={compact ? 'compact' : 'grid'} />
}

export default CollectionProductCard
