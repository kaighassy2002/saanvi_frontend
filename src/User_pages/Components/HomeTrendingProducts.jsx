import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNewArrivals } from '../../hooks/useNewArrivals'
import { useBestSellers } from '../../hooks/useBestSellers'
import { useWishlist } from '../../hooks/useWishlist'
import { useReviewSummaries } from '../../hooks/useReviewSummaries'
import { useFeaturedProducts } from '../../hooks/useFeaturedProducts'
import { useHomeContent } from '../../hooks/useHomeContent'
import { trendingViewAllHref } from '../../services/homeMerchandising'
import { getProductPrimaryImage } from '../utils/productImages'
import HomeProductCard from './HomeProductCard'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const GRID_SIZE = 10

function ProductSkeleton() {
  return (
    <div>
      <div className="jewelsium-skeleton aspect-square w-full" />
      <div className="jewelsium-skeleton mx-auto mt-3 h-3 w-2/3" />
      <div className="jewelsium-skeleton mx-auto mt-2 h-3 w-1/2" />
    </div>
  )
}

function HomeTrendingProducts() {
  const ref = useScrollReveal()
  const { homeSections } = useHomeContent()
  const trending = homeSections.trending || {}
  const tabs = useMemo(
    () =>
      Array.isArray(trending.tabs) && trending.tabs.length
        ? trending.tabs
        : [
            { id: 'featured', label: 'Featured' },
            { id: 'new', label: 'New Arrivals' },
            { id: 'bestseller', label: 'Best Seller' },
          ],
    [trending.tabs]
  )
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'featured')
  const { products: newArrivals, loading: newLoading } = useNewArrivals()
  const { products: featured, loading: featuredLoading } = useFeaturedProducts(GRID_SIZE)
  const { products: bestseller, loading: bestsellerLoading } = useBestSellers(GRID_SIZE)
  const { toggle, isInWishlist } = useWishlist()

  const newProducts = useMemo(() => newArrivals.slice(0, GRID_SIZE), [newArrivals])

  const displayProducts =
    activeTab === 'new' ? newProducts : activeTab === 'bestseller' ? bestseller : featured

  const loading =
    (activeTab === 'new'
      ? newLoading
      : activeTab === 'featured'
        ? featuredLoading
        : bestsellerLoading) && displayProducts.length === 0

  const reviewSummaries = useReviewSummaries(displayProducts.map((p) => p.id))

  return (
    <section ref={ref} className="section-container section-reveal py-10 sm:py-16">
      {trending.overline ? <p className="text-overline text-center">{trending.overline}</p> : null}
      {trending.title ? (
        <h2 className="section-heading mt-2 text-center">{trending.title}</h2>
      ) : null}

      <div
        className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        role="tablist"
        aria-label="Product collections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`jewelsium-tabs__btn ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="mt-10 border border-[#ebebeb] bg-[#fafafa] p-10 text-center">
          <p className="text-helper text-center">No products to show yet.</p>
          <Link
            to="/collections"
            className="mt-4 inline-flex min-h-[44px] items-center bg-[#1f1514] px-8 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.14em] text-white"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <div
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5"
          role="tabpanel"
        >
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

      {trending.viewAllLabel ? (
        <div className="mt-12 text-center">
          <Link
            to={trendingViewAllHref(activeTab)}
            className="inline-flex border-b border-[#1f1514] pb-1 font-sans text-sm font-medium uppercase tracking-[0.12em] text-[#1f1514] transition hover:border-[#7a2c3a] hover:text-[#7a2c3a]"
          >
            {trending.viewAllLabel}
          </Link>
        </div>
      ) : null}
    </section>
  )
}

export default HomeTrendingProducts
