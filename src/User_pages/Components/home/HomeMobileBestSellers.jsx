import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBestSellers } from '../../../hooks/useBestSellers'
import { useWishlist } from '../../../hooks/useWishlist'
import { useReviewSummaries } from '../../../hooks/useReviewSummaries'
import { useHomeContent } from '../../../hooks/useHomeContent'
import { mobileTrendingViewAllHref } from '../../../services/homeMerchandising'
import { getProductPrimaryImage } from '../../utils/productImages'
import HomeProductCard from '../HomeProductCard'

const GRID_SIZE = 6

function HomeMobileBestSellers() {
  const { homeSections } = useHomeContent()
  const trending = homeSections.trending || {}
  const bestsellerTab = useMemo(() => {
    const tabs = Array.isArray(trending.tabs) ? trending.tabs : []
    return tabs.find((t) => t.id === 'bestseller') || { id: 'bestseller', label: 'Best Seller' }
  }, [trending.tabs])

  const { products: displayProducts, loading } = useBestSellers(GRID_SIZE)
  const { toggle, isInWishlist } = useWishlist()
  const reviewSummaries = useReviewSummaries(displayProducts.map((p) => p.id))

  if (!loading && displayProducts.length === 0) return null

  return (
    <section className="home-mobile-section home-mobile-section--bestseller" aria-label="Best sellers">
      <div className="home-mobile-section__head">
        <h2 className="home-mobile-section__title">{bestsellerTab.label || 'Best Seller'}</h2>
        <Link to={mobileTrendingViewAllHref('bestseller')} className="home-mobile-section__link">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="home-mobile-products home-mobile-products--compact">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <div className="jewelsium-skeleton aspect-square w-full rounded-md" />
              <div className="jewelsium-skeleton mt-2 h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="home-mobile-products home-mobile-products--compact">
          {displayProducts.map((product) => (
            <HomeProductCard
              key={product.id}
              product={product}
              reviewSummary={reviewSummaries[String(product.id)]}
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
      )}
    </section>
  )
}

export default HomeMobileBestSellers
