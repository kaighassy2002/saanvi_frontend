import React from 'react'
import { useCatalog } from '../../hooks/useCatalog'
import { useWishlist } from '../../hooks/useWishlist'
import { getRelatedProducts } from '../../services/relatedProducts'
import { getRecentlyViewedIds } from '../../services/recentlyViewed'
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
  const { products } = useCatalog()

  const related = React.useMemo(
    () => getRelatedProducts(products, currentProduct, 4),
    [products, currentProduct]
  )

  const recentlyViewed = React.useMemo(() => {
    const ids = getRecentlyViewedIds().filter((id) => String(id) !== String(currentProduct.id))
    return ids
      .map((id) => products.find((p) => String(p.id) === id))
      .filter(Boolean)
      .slice(0, 4)
  }, [products, currentProduct.id])

  if (!related.length && !recentlyViewed.length) return null

  return (
    <div className="section-container border-t border-[#eadfc9] pt-8">
      <ProductRow title="You may also like" products={related} />
      <ProductRow title="Recently viewed" products={recentlyViewed} />
    </div>
  )
}

export default ProductRecommendations
