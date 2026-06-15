import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNewArrivals } from '../../../hooks/useNewArrivals'
import { useWishlist } from '../../../hooks/useWishlist'
import { useFeaturedProducts } from '../../../hooks/useFeaturedProducts'
import { useReviewSummaries } from '../../../hooks/useReviewSummaries'
import { useHomeContent } from '../../../hooks/useHomeContent'
import { mobileTrendingViewAllHref } from '../../../services/homeMerchandising'
import { getProductPrimaryImage } from '../../utils/productImages'
import HomeProductCard from '../HomeProductCard'

const GRID_SIZE = 8

function HomeMobileTrending() {
  const { homeSections } = useHomeContent()
  const trending = homeSections.trending || {}
  const mobileCopy = homeSections.mobileTrending || {}
  const tabs = useMemo(() => {
    const raw =
      Array.isArray(trending.tabs) && trending.tabs.length
        ? trending.tabs
        : [
            { id: 'featured', label: 'Featured' },
            { id: 'new', label: 'New' },
            { id: 'bestseller', label: 'Best deals' },
          ]
    return raw.filter((t) => t.id !== 'bestseller')
  }, [trending.tabs])
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'featured')
  const { products: newArrivals, loading: newLoading } = useNewArrivals()
  const { products: featured, loading: featuredLoading } = useFeaturedProducts(GRID_SIZE)
  const { toggle, isInWishlist } = useWishlist()

  const newProducts = useMemo(() => newArrivals.slice(0, GRID_SIZE), [newArrivals])
  const displayProducts = activeTab === 'new' ? newProducts : featured

  const loading =
    (activeTab === 'new' ? newLoading : featuredLoading) && displayProducts.length === 0

  const viewAllHref = mobileTrendingViewAllHref(activeTab)
  const reviewSummaries = useReviewSummaries(displayProducts.map((p) => p.id))

  return (
    <section className="home-mobile-section home-mobile-section--trending" aria-label="Trending products">
      <div className="home-mobile-section__head">
        <div>
          {trending.overline ? (
            <p className="home-mobile-section__overline">{trending.overline}</p>
          ) : null}
          {mobileCopy.title || trending.title ? (
            <h2 className="home-mobile-section__title">
              {mobileCopy.title || trending.title}
            </h2>
          ) : null}
        </div>
        {mobileCopy.linkLabel ? (
          <Link to={viewAllHref} className="home-mobile-section__link">
            {mobileCopy.linkLabel}
          </Link>
        ) : null}
      </div>

      <div className="home-mobile-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`home-mobile-tab${activeTab === tab.id ? ' home-mobile-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="home-mobile-products">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <div className="jewelsium-skeleton aspect-square w-full rounded-md" />
              <div className="jewelsium-skeleton mt-2 h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="home-mobile-empty">
          <p className="home-mobile-empty__text">No products to show yet.</p>
          <Link to="/collections" className="home-mobile-empty__btn">
            Browse shop
          </Link>
        </div>
      ) : (
        <div className="home-mobile-products" role="tabpanel">
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

export default HomeMobileTrending
