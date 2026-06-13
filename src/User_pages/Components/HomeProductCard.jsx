import React, { memo } from 'react'
import StoreProductCard from './StoreProductCard'

function HomeProductCard(props) {
  return <StoreProductCard {...props} variant="home" />
}

export default memo(HomeProductCard)
