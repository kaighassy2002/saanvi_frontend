import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../../hooks/useCatalog'
import { useNewArrivals } from '../../../hooks/useNewArrivals'
import { useWishlist } from '../../../hooks/useWishlist'
import { getProductPrimaryImage } from '../../utils/productImages'
import HomeProductCard from '../HomeProductCard'

const TABS = [
  { id: 'featured', label: 'Featured' },
  { id: 'new', label: 'New' },
  { id: 'bestseller', label: 'Best deals' },
]

const GRID_SIZE = 8

function HomeMobileTrending() {
  const [activeTab, setActiveTab] = useState('featured')
  const { products, loading: catalogLoading } = useCatalog()
  const { products: newArrivals, loading: newLoading } = useNewArrivals()
  const { toggle, isInWishlist } = useWishlist()

  const featured = useMemo(() => products.slice(0, GRID_SIZE), [products])

  const bestseller = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const da =
          a.originalPrice > a.price && a.originalPrice > 0
            ? (a.originalPrice - a.price) / a.originalPrice
            : 0
        const db =
          b.originalPrice > b.price && b.originalPrice > 0
            ? (b.originalPrice - b.price) / b.originalPrice
            : 0
        return db - da
      })
      .slice(0, GRID_SIZE)
  }, [products])

  const newProducts = useMemo(() => {
    if (newArrivals.length >= GRID_SIZE) return newArrivals.slice(0, GRID_SIZE)
    const ids = new Set(newArrivals.map((p) => String(p.id)))
    const extra = products.filter((p) => !ids.has(String(p.id)))
    return [...newArrivals, ...extra].slice(0, GRID_SIZE)
  }, [newArrivals, products])

  const displayProducts =
    activeTab === 'new' ? newProducts : activeTab === 'bestseller' ? bestseller : featured

  const loading =
    (activeTab === 'new' ? newLoading : catalogLoading) && displayProducts.length === 0

  const viewAllHref =
    activeTab === 'new'
      ? '/collections?sort=latest'
      : activeTab === 'bestseller'
        ? '/collections?sort=price-high'
        : '/collections'

  return (
    <section className="home-mobile-section" aria-label="Trending products">
      <div className="home-mobile-section__head">
        <h2 className="home-mobile-section__title">Trending now</h2>
        <Link to={viewAllHref} className="home-mobile-section__link">
          View all
        </Link>
      </div>

      <div className="home-mobile-tabs" role="tablist">
        {TABS.map((tab) => (
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
        <p className="px-4 py-8 text-center font-playfair text-sm text-muted">No products yet.</p>
      ) : (
        <div className="home-mobile-products" role="tabpanel">
          {displayProducts.map((product) => (
            <HomeProductCard
              key={product.id}
              product={product}
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
