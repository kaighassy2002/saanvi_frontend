import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { useCatalog } from '../../hooks/useCatalog'
import { useWishlist } from '../../hooks/useWishlist'
import { fetchPublicCategoryTabs } from '../../services/catalogService'

function ProductListing() {
  const { products, loading, error } = useCatalog()
  const { toggle, isInWishlist } = useWishlist()
  const [categories, setCategories] = useState(['All'])
  const [searchParams] = useSearchParams()
  const [availability, setAvailability] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const initialVisibleCount = 8
  const productsPerLoad = 8
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount)
  const selectedCategory = searchParams.get('category') || 'All'
  const searchTerm = (searchParams.get('search') || '').toLowerCase()
  const priceBounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 }
    const prices = products.map((product) => Number(product.price) || 0)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [products])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 })

  useEffect(() => {
    let cancelled = false
    fetchPublicCategoryTabs(products).then((tabs) => {
      if (!cancelled) setCategories(tabs.length ? tabs : ['All'])
    })
    return () => {
      cancelled = true
    }
  }, [products])

  useEffect(() => {
    setPriceRange(priceBounds)
  }, [priceBounds])

  const categoryCounts = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        const key = product.category || 'Uncategorized'
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      { All: products.length }
    )
  }, [products])

  const inStockCount = useMemo(
    () => products.filter((product) => Number(product.stock ?? 0) > 0).length,
    [products]
  )
  const outOfStockCount = products.length - inStockCount

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory
        const searchMatch = product.name.toLowerCase().includes(searchTerm)
        const stock = Number(product.stock ?? 0)
        const availabilityMatch =
          availability === 'all' ||
          (availability === 'in-stock' ? stock > 0 : stock <= 0)
        const price = Number(product.price) || 0
        const withinPrice = price >= priceRange.min && price <= priceRange.max
        return categoryMatch && searchMatch && availabilityMatch && withinPrice
      }),
    [availability, priceRange.max, priceRange.min, products, searchTerm, selectedCategory]
  )

  const sortedProducts = useMemo(() => {
    const copy = [...filteredProducts]
    if (sortBy === 'price-low') {
      return copy.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    }
    if (sortBy === 'price-high') {
      return copy.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    }
    if (sortBy === 'name') {
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortBy === 'latest') {
      return copy.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    }
    return copy
  }, [filteredProducts, sortBy])

  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleCount),
    [sortedProducts, visibleCount]
  )
  const hasMoreProducts = visibleCount < sortedProducts.length

  useEffect(() => {
    setVisibleCount(initialVisibleCount)
  }, [selectedCategory, searchTerm, availability, priceRange.min, priceRange.max, sortBy])

  const buildCategoryHref = (category) => {
    const params = new URLSearchParams()
    const activeSearch = searchParams.get('search')
    if (activeSearch) params.set('search', activeSearch)
    if (category !== 'All') params.set('category', category)
    const query = params.toString()
    return query ? `/collections?${query}` : '/collections'
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <section
        className="relative overflow-hidden border-y border-[#e2d6c3]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(32, 20, 15, 0.72), rgba(32, 20, 15, 0.28)), url('https://i.pinimg.com/1200x/c3/ab/cb/c3abcbd1eb2eebdc0dbefa6b53f5d1b9.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="section-container py-16 sm:py-20">
        
         
        </div>
      </section>

      <section className="section-container py-10 sm:py-14">
        {error ? (
          <p className="mb-6 rounded-xl bg-red-50 px-4 py-2 text-center font-playfair text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mb-8 text-center font-playfair text-muted">Loading collections…</p>
        ) : null}

        <div className="grid items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="lux-card p-5">
              <h2 className="mb-4 font-bodoni text-lg text-ink">Categories</h2>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category}>
                    <Link
                      to={buildCategoryHref(category)}
                      className={`flex items-center justify-between rounded-lg px-2 py-1.5 font-playfair text-sm transition ${
                        selectedCategory === category
                          ? 'bg-[#f5ead7] text-[#7a2c3a]'
                          : 'text-muted hover:text-[#7a2c3a]'
                      }`}
                    >
                      <span>{category}</span>
                      <span className="text-xs text-[#9a8577]">({categoryCounts[category] || 0})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lux-card space-y-6 p-5">
              <div>
                <h3 className="font-bodoni text-lg text-ink">Filter</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">All products</p>
              </div>

              <div>
                <h4 className="font-bodoni text-base text-ink">Availability</h4>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  <button
                    type="button"
                    onClick={() => setAvailability('all')}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                      availability === 'all' ? 'bg-[#f5ead7] text-[#7a2c3a]' : ''
                    }`}
                  >
                    <span>All</span>
                    <span>({products.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailability('in-stock')}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                      availability === 'in-stock' ? 'bg-[#f5ead7] text-[#7a2c3a]' : ''
                    }`}
                  >
                    <span>In stock</span>
                    <span>({inStockCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailability('out-stock')}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                      availability === 'out-stock' ? 'bg-[#f5ead7] text-[#7a2c3a]' : ''
                    }`}
                  >
                    <span>Out of stock</span>
                    <span>({outOfStockCount})</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bodoni text-base text-ink">Price</h4>
                <div className="mt-4 space-y-3">
                  <label className="block text-xs uppercase tracking-[0.1em] text-muted">
                    Minimum
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={priceRange.min}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setPriceRange((prev) => ({ ...prev, min: Math.min(value, prev.max) }))
                      }}
                      className="mt-2 w-full accent-[#b88a43]"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.1em] text-muted">
                    Maximum
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={priceRange.max}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setPriceRange((prev) => ({ ...prev, max: Math.max(value, prev.min) }))
                      }}
                      className="mt-2 w-full accent-[#b88a43]"
                    />
                  </label>
                  <p className="font-playfair text-sm text-muted">
                    ₹{priceRange.min.toLocaleString()} - ₹{priceRange.max.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bodoni text-base text-ink">Brand</h4>
                <p className="mt-2 font-playfair text-sm text-muted">Acile</p>
              </div>

              <div>
                <h4 className="font-bodoni text-base text-ink">Size</h4>
                <div className="mt-2 space-y-2 font-playfair text-sm text-muted">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#b88a43]" />
                    <span>Standard</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#b88a43]" />
                    <span>Custom</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-bodoni text-base text-ink">Color</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['#f1b8ae', '#97bfd6', '#8fbeaa', '#dad6cd', '#db9798', '#73abcf'].map((color) => (
                    <span
                      key={color}
                      className="h-4 w-4 rounded-full border border-white shadow"
                      style={{ backgroundColor: color }}
                    ></span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#dbc8ad] bg-[#1f2f44] p-5 text-white shadow-[0_15px_35px_-24px_rgba(26,40,58,0.85)]">
              <p className="text-kicker text-[#f3dbaf]">Weekly Sale</p>
              <h3 className="mt-2 font-bodoni text-2xl">Only for 30% Off</h3>
              <button
                type="button"
                className="mt-4 rounded-full border border-[#f5d8a9] px-4 py-2 font-playfair text-xs tracking-[0.08em] text-[#f5d8a9] transition hover:bg-white hover:text-[#1f2f44]"
              >
                SHOP NOW
              </button>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bodoni text-2xl text-ink">Products ({sortedProducts.length})</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="sort-products" className="font-playfair text-sm text-muted">
                  Sort by
                </label>
                <select
                  id="sort-products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-[#d8c4a7] bg-white px-3 py-2 font-playfair text-sm text-ink outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="latest">Latest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div className="mb-7 overflow-hidden rounded-2xl border border-[#dfcfb5] bg-gradient-to-r from-[#b58c50] via-[#cfab6a] to-[#c29a59] p-6 text-white">
              <p className="font-playfair text-sm uppercase tracking-[0.12em] text-[#f7e7cd]">
                New Collection
              </p>
              <h3 className="mt-2 max-w-md font-bodoni text-3xl leading-tight">
                Luxury at a price you&apos;ll love jewellery
              </h3>
              <button
                type="button"
                className="mt-4 rounded-full border border-[#f7e4c2] px-4 py-2 font-playfair text-xs tracking-[0.08em] text-[#f7e4c2] transition hover:bg-white hover:text-[#9b7335]"
              >
                SHOP COLLECTION
              </button>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="lux-card py-16 text-center">
                <h2 className="card-heading">No products found</h2>
                <p className="mt-2 text-helper">Try a different category, filter, or search term.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => {
                    const saved = isInWishlist(product.id)
                    const price = Number(product.price || 0)
                    const originalPrice = Number(product.originalPrice || 0)
                    const discount =
                      originalPrice > price && originalPrice > 0
                        ? Math.round(((originalPrice - price) / originalPrice) * 100)
                        : 0
                    const inStock = Number(product.stock ?? 0) > 0
                    return (
                      <div
                        key={product.id}
                        className="group overflow-hidden rounded-3xl border border-[#e2d2ba] bg-[linear-gradient(180deg,#fffdfa_0%,#fff7ec_100%)] shadow-[0_18px_36px_-28px_rgba(58,21,29,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_48px_-26px_rgba(58,21,29,0.65)]"
                      >
                        <div className="relative m-3 overflow-hidden rounded-2xl bg-[#f8f2e7]">
                          {discount > 0 ? (
                            <span className="absolute left-3 top-3 z-10 rounded-full bg-[#7a2c3a] px-2.5 py-1 font-playfair text-[11px] tracking-[0.06em] text-white">
                              -{discount}% OFF
                            </span>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              toggle({
                                productId: product.id,
                                name: product.name,
                                image: product.image,
                                price: product.price,
                              })
                            }
                            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#eadbc5] bg-white text-sm text-[#7a2c3a] shadow-sm transition hover:border-[#7a2c3a]"
                            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <i className={`fa-heart ${saved ? 'fa-solid text-gold' : 'fa-regular'}`}></i>
                          </button>

                          <Link to={`/product/${product.id}`} className="block h-60 overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105"
                            />
                          </Link>
                        </div>

                        <div className="px-4 pb-4 pt-1">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="rounded-full bg-[#f1e4cf] px-2.5 py-1 font-playfair text-[11px] uppercase tracking-[0.08em] text-[#7b5f3d]">
                              {product.category || 'Jewellery'}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 font-playfair text-[11px] ${
                                inStock ? 'bg-[#e6f4e9] text-[#24653a]' : 'bg-[#f9e6e7] text-[#a23f4a]'
                              }`}
                            >
                              {inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>

                          <Link to={`/product/${product.id}`} className="block">
                            <h3 className="line-clamp-2 min-h-[3.5rem] font-bodoni text-xl leading-7 text-ink">
                              {product.name}
                            </h3>
                          </Link>

                          <div className="mt-3 flex items-end justify-between">
                            <div className="space-y-1">
                              <span className="block font-playfair text-xl text-[#b78439]">
                                ₹{price.toLocaleString()}
                              </span>
                              <span className="block font-playfair text-sm text-muted line-through">
                                ₹{originalPrice.toLocaleString()}
                              </span>
                            </div>
                            <Link
                              to={`/product/${product.id}`}
                              className="rounded-full border border-[#d8c19f] px-4 py-2 font-playfair text-xs tracking-[0.06em] text-[#7a2c3a] transition hover:border-[#7a2c3a] hover:bg-[#7a2c3a] hover:text-white"
                            >
                              VIEW
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {hasMoreProducts ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((count) => Math.min(count + productsPerLoad, sortedProducts.length))
                      }
                      className="rounded-full border border-[#d8c19f] px-5 py-2 font-playfair text-xs tracking-[0.08em] text-[#7a2c3a] transition hover:border-[#7a2c3a] hover:bg-[#7a2c3a] hover:text-white"
                    >
                      VIEW MORE
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c19f] bg-white text-[#7a2c3a] shadow-[0_12px_25px_-14px_rgba(58,21,29,0.7)] transition hover:-translate-y-0.5 hover:border-[#7a2c3a] hover:bg-[#7a2c3a] hover:text-white"
        aria-label="Scroll to top"
      >
        <i className="fa-solid fa-arrow-up"></i>
      </button>
      <Footer />
    </div>
  )
}

export default ProductListing
