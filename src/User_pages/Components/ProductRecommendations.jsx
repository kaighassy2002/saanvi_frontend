import React from 'react'
import { useRelatedProducts } from '../../hooks/useRelatedProducts'
import { useRecentlyViewedProducts } from '../../hooks/useRecentlyViewedProducts'
import { useWishlist } from '../../hooks/useWishlist'
import CollectionProductCard from './CollectionProductCard'
import { getProductPrimaryImage } from '../utils/productImages'

function ProductRow({ title, products }) {
  const { toggle, isInWishlist } = useWishlist()
  if (!products.length) return null

  return (
    <section className="mt-10 sm:mt-12">
      <h2 className="font-bodoni text-2xl text-ink sm:text-3xl">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <CollectionProductCard
            key={product.id}
            product={product}
            compact
            saved={isInWishlist(product.id)}
            onToggleWishlist={() =>
              toggle({
                productId: product.id,
                name: product.name,
                image: getProductPrimaryImage(product),
                price: product.price,
              })
            }
          />
        ))}
      </div>
    </section>
  )
}

function ProductRecommendations({ currentProduct }) {
  const { products: related } = useRelatedProducts(currentProduct?.id, 4)
  const recentlyViewed = useRecentlyViewedProducts(currentProduct?.id, 4)

  if (!related.length && !recentlyViewed.length) return null

  return (
    <div className="section-container border-t border-[#eadfc9] pt-8">
      <ProductRow title="You may also like" products={related} />
      <ProductRow title="Recently viewed" products={recentlyViewed} />
    </div>
  )
}

export default ProductRecommendations
