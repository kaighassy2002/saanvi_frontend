import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import CollectionProductCard from '../Components/CollectionProductCard'
import CollectionFilters from '../Components/CollectionFilters'
import CollectionSortFilterBar from '../Components/CollectionSortFilterBar'
import CollectionCategoryChips from '../Components/CollectionCategoryChips'
import CollectionPageHeader from '../Components/CollectionPageHeader'
import { useCatalog } from '../../hooks/useCatalog'
import {
  buildListingSearchParams,
  listingParamsToHref,
  parseListingState,
  productMatchesSearch,
} from '../../services/listingSearchParams'
import { pushRecentSearch } from '../../services/recentSearches'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { useCollectionScrollPin } from '../../hooks/useCollectionScrollPin'
import { useWishlist } from '../../hooks/useWishlist'
import { useReviewSummaries } from '../../hooks/useReviewSummaries'
import { fetchPublicCategoryTabs } from '../../services/catalogService'
import {
  buildBasicMaterialFacetOptions,
  buildColorFacetOptions,
  getProductMaterial,
  productMatchesColorFacet,
  productMatchesFacet,
} from '../../services/collectionProductAttributes'
import { productIsInStock } from '../../services/productVariants'
import '../Styles/collection.css'

const SKELETON_COUNT = 8
const PRODUCTS_PER_PAGE = 16

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'latest', label: 'Newest first' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
]

function ProductSkeleton({ compact = false }) {
  return (
    <div
      className={`overflow-hidden bg-white ${compact ? 'rounded-xl border border-[#ebe3d6]' : 'rounded-2xl border border-[#e8dcc8]'}`}
    >
      <div className="collection-skeleton aspect-[4/5] w-full" />
      <div className={`space-y-2 ${compact ? 'p-2' : 'p-3 sm:p-4'}`}>
        <div className="collection-skeleton h-4 w-full rounded" />
        <div className="collection-skeleton h-5 w-2/3 rounded" />
      </div>
    </div>
  )
}

function ProductListing() {
  const { products, loading, error } = useCatalog()
  const { toggle, isInWishlist } = useWishlist()
  const [categories, setCategories] = useState(['All'])
  const [searchParams, setSearchParams] = useSearchParams()
  const [localSearch, setLocalSearch] = useState(() => searchParams.get('search') || '')
  const [availability, setAvailability] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [compactCards, setCompactCards] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  )
  const searchBlockRef = useRef(null)
  const compactBarRef = useRef(null)
  const [searchPastY, setSearchPastY] = useState(96)
  const { showCompactBar, compactBarHeight, setCompactBarHeight } =
    useCollectionScrollPin(searchPastY)

  const selectedCategory = searchParams.get('category') || 'All'
  const searchTerm = (searchParams.get('search') || '').trim()
  const searchTermLower = searchTerm.toLowerCase()

  const priceBounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 }
    const prices = products.map((product) => Number(product.price) || 0)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [products])

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 })
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])

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
    if (priceBounds.max <= priceBounds.min && products.length === 0) return
    const parsed = parseListingState(searchParams, priceBounds)
    setSortBy(parsed.sortBy)
    setAvailability(parsed.availability)
    setPriceRange(parsed.priceRange)
    setSelectedColors(parsed.selectedColors)
    setSelectedMaterials(parsed.selectedMaterials)
  }, [searchParams, priceBounds.min, priceBounds.max, products.length])

  useEffect(() => {
    const lock = filtersOpen || sortOpen
    if (!lock) return undefined
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (isDesktop) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [filtersOpen, sortOpen])

  const categoryCounts = useMemo(
    () =>
      products.reduce(
        (acc, product) => {
          const key = product.category || 'Uncategorized'
          acc[key] = (acc[key] || 0) + 1
          return acc
        },
        { All: products.length }
      ),
    [products]
  )

  const inStockCount = useMemo(
    () => products.filter((product) => productIsInStock(product)).length,
    [products]
  )
  const outOfStockCount = products.length - inStockCount

  const colorOptions = useMemo(() => buildColorFacetOptions(products), [products])

  const materialOptions = useMemo(() => buildBasicMaterialFacetOptions(products), [products])

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory
        const searchMatch = productMatchesSearch(product, searchTerm)
        const inStock = productIsInStock(product)
        const availabilityMatch =
          availability === 'all' || (availability === 'in-stock' ? inStock : !inStock)
        const price = Number(product.price) || 0
        const colorMatch = productMatchesColorFacet(product, selectedColors)
        const materialMatch = productMatchesFacet(selectedMaterials, getProductMaterial(product))
        return (
          categoryMatch &&
          searchMatch &&
          availabilityMatch &&
          colorMatch &&
          materialMatch &&
          price >= priceRange.min &&
          price <= priceRange.max
        )
      }),
    [
      availability,
      priceRange.max,
      priceRange.min,
      products,
      searchTermLower,
      selectedCategory,
      selectedColors,
      selectedMaterials,
    ]
  )

  const sortedProducts = useMemo(() => {
    const copy = [...filteredProducts]
    if (sortBy === 'price-low') return copy.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (sortBy === 'price-high') return copy.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    if (sortBy === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'latest') return copy.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    return copy
  }, [filteredProducts, sortBy])

  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleCount),
    [sortedProducts, visibleCount]
  )

  const reviewSummaries = useReviewSummaries(visibleProducts.map((p) => p.id))

  const hasMore = visibleCount < sortedProducts.length

  const activeFilterCount = [
    selectedCategory !== 'All',
    Boolean(searchTerm),
    availability !== 'all',
    priceRange.min !== priceBounds.min || priceRange.max !== priceBounds.max,
    selectedColors.length > 0,
    selectedMaterials.length > 0,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE)
  }, [
    selectedCategory,
    searchTerm,
    availability,
    priceRange.min,
    priceRange.max,
    sortBy,
    selectedColors,
    selectedMaterials,
  ])

  useEffect(() => {
    setLocalSearch(searchParams.get('search') || '')
  }, [searchParams])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = () => setCompactCards(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const measureSearchPast = () => {
      const search = searchBlockRef.current
      if (!search) return
      const rect = search.getBoundingClientRect()
      const docBottom = rect.bottom + window.scrollY
      setSearchPastY(Math.round(docBottom + 4))
    }
    measureSearchPast()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureSearchPast) : null
    if (searchBlockRef.current && ro) ro.observe(searchBlockRef.current)
    window.addEventListener('resize', measureSearchPast)
    return () => {
      window.removeEventListener('resize', measureSearchPast)
      ro?.disconnect()
    }
  }, [])

  useEffect(() => {
    const node = compactBarRef.current
    if (!node) return undefined
    const measure = () => setCompactBarHeight(node.offsetHeight || 44)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [hasActiveFilters, activeFilterCount, setCompactBarHeight])

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    requestAnimationFrame(() => {
      setVisibleCount((count) => Math.min(count + PRODUCTS_PER_PAGE, sortedProducts.length))
      setLoadingMore(false)
    })
  }, [hasMore, loadingMore, sortedProducts.length])

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: loading || loadingMore,
  })

  const applyListing = useCallback(
    (patch) => {
      const next = buildListingSearchParams(patch, searchParams)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const handleListingSearch = (e) => {
    e.preventDefault()
    const trimmed = localSearch.trim()
    if (trimmed) pushRecentSearch(trimmed)
    applyListing({ search: trimmed })
  }

  const buildCategoryHref = (category) => {
    const next = buildListingSearchParams({ category }, searchParams)
    return listingParamsToHref(next)
  }

  const buildHrefWithoutSearch = () => {
    const next = buildListingSearchParams({ search: '' }, searchParams)
    return listingParamsToHref(next)
  }

  const clearAllFilters = () => {
    setSearchParams({})
  }

  const handleSortChange = (value) => {
    setSortBy(value)
    applyListing({ sort: value })
  }

  const handleAvailabilityChange = (value) => {
    setAvailability(value)
    applyListing({ stock: value })
  }

  const handlePriceRangeChange = (range) => {
    setPriceRange(range)
    applyListing({
      priceRange: range,
      boundsMin: priceBounds.min,
      boundsMax: priceBounds.max,
    })
  }

  const toggleColor = (color) => {
    const next = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color]
    setSelectedColors(next)
    applyListing({ colors: next })
  }

  const toggleMaterial = (material) => {
    const next = selectedMaterials.includes(material)
      ? selectedMaterials.filter((m) => m !== material)
      : [...selectedMaterials, material]
    setSelectedMaterials(next)
    applyListing({ materials: next })
  }

  const pageTitle =
    selectedCategory !== 'All'
      ? selectedCategory
      : searchTerm
        ? `“${searchTerm}”`
        : 'All Collections'

  const filterPanelProps = {
    availability,
    setAvailability: handleAvailabilityChange,
    productsCount: products.length,
    inStockCount,
    outOfStockCount,
    priceBounds,
    priceRange,
    setPriceRange: handlePriceRangeChange,
    colorOptions,
    selectedColors,
    onColorToggle: toggleColor,
    materialOptions,
    selectedMaterials,
    onMaterialToggle: toggleMaterial,
  }

  const activeFilterPills = (
    <>
      {selectedCategory !== 'All' ? (
        <Link
          to={buildCategoryHref('All')}
          className="collection-active-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-playfair text-xs"
        >
          {selectedCategory}
          <i className="fa-solid fa-xmark text-[10px] opacity-70" aria-hidden />
        </Link>
      ) : null}
      {searchTerm ? (
        <Link
          to={buildHrefWithoutSearch()}
          className="collection-active-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-playfair text-xs"
        >
          {searchTerm}
          <i className="fa-solid fa-xmark text-[10px] opacity-70" aria-hidden />
        </Link>
      ) : null}
      {availability !== 'all' ? (
        <button
          type="button"
          onClick={() => handleAvailabilityChange('all')}
          className="collection-active-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-playfair text-xs"
        >
          {availability === 'in-stock' ? 'In stock' : 'Out of stock'}
          <i className="fa-solid fa-xmark text-[10px] opacity-70" aria-hidden />
        </button>
      ) : null}
      {(priceRange.min !== priceBounds.min || priceRange.max !== priceBounds.max) &&
      priceBounds.max > priceBounds.min ? (
        <button
          type="button"
          onClick={() => handlePriceRangeChange(priceBounds)}
          className="collection-active-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-playfair text-xs"
        >
          ₹{priceRange.min.toLocaleString()}–₹{priceRange.max.toLocaleString()}
          <i className="fa-solid fa-xmark text-[10px] opacity-70" aria-hidden />
        </button>
      ) : null}
      {selectedColors.map((color) => (
        <button
          key={`color-${color}`}
          type="button"
          onClick={() => toggleColor(color)}
          className="collection-active-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-playfair text-xs"
        >
          {color}
          <i className="fa-solid fa-xmark text-[10px] opacity-70" aria-hidden />
        </button>
      ))}
      {selectedMaterials.map((material) => (
        <button
          key={`material-${material}`}
          type="button"
          onClick={() => toggleMaterial(material)}
          className="collection-active-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-playfair text-xs"
        >
          {material}
          <i className="fa-solid fa-xmark text-[10px] opacity-70" aria-hidden />
        </button>
      ))}
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={clearAllFilters}
          className="collection-active-pill-clear shrink-0 font-playfair text-xs"
        >
          Clear all
        </button>
      ) : null}
    </>
  )

  const renderProductGrid = (compactCards) =>
    loading ? (
    <div className="collection-products-grid">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <ProductSkeleton key={i} compact={compactCards} />
      ))}
    </div>
  ) : sortedProducts.length === 0 ? (
    <div className="lux-card px-6 py-14 text-center sm:py-20">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ead7] text-2xl text-[#7a2c3a]">
        <i className="fa-regular fa-gem" aria-hidden />
      </div>
      <h2 className="card-heading">No pieces match your filters</h2>
      <p className="mt-2 text-helper">Try another category or clear filters.</p>
      <button type="button" onClick={clearAllFilters} className="lux-button mt-6">
        Clear filters
      </button>
    </div>
  ) : (
    <>
      <div className="collection-products-grid">
        {visibleProducts.map((product) => (
          <CollectionProductCard
            key={product.id}
            product={product}
            reviewSummary={reviewSummaries[String(product.id)]}
            saved={isInWishlist(product.id)}
            compact={compactCards}
            onToggleWishlist={() =>
              toggle({
                productId: product.id,
                name: product.name,
                image: product.image,
                price: product.price,
              })
            }
          />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />

      {(hasMore || loadingMore) && (
        <div className="collection-products-grid collection-products-grid--load-more mt-2 lg:mt-3">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductSkeleton key={`more-${i}`} compact={compactCards} />
          ))}
        </div>
      )}

      {!hasMore && sortedProducts.length > PRODUCTS_PER_PAGE ? (
        <p className="mt-6 text-center font-playfair text-xs text-muted">
          You&apos;ve seen all {sortedProducts.length} products
        </p>
      ) : null}
    </>
  )

  const productGrid = renderProductGrid(compactCards)

  return (
    <div id="main-content" className="page-shell collection-page" tabIndex={-1}>
      <SiteHeader staticOnMobile />

      {/* Fixed Sort/Filter — overlays products; no layout spacer */}
      <div
        className={`collection-chrome-fixed lg:hidden ${showCompactBar ? 'is-visible' : ''}`}
        aria-hidden={!showCompactBar}
      >
        <div ref={compactBarRef} className="collection-chrome-fixed__inner">
          <CollectionSortFilterBar
            activeFilterCount={activeFilterCount}
            onSortClick={() => setSortOpen(true)}
            onFilterClick={() => setFiltersOpen(true)}
          />
          {hasActiveFilters ? (
            <div className="collection-filter-pills flex gap-2 overflow-x-auto bg-[#fffaf3] px-3 py-1.5">
              {activeFilterPills}
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile: header pad + in-flow search & sort (scroll away naturally) */}
      <div
        className={`collection-mobile-toolbar lg:hidden ${
          showCompactBar ? 'is-search-hidden is-compact-active' : ''
        }`}
      >
        <form
          ref={searchBlockRef}
          className="collection-mobile-toolbar__search px-3 py-2 sm:px-4"
          onSubmit={handleListingSearch}
        >
          <div className="relative">
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search jewellery…"
              className="input-search py-2 pr-12 text-sm"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a2c3a]"
              aria-label="Search"
            >
              <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden />
            </button>
          </div>
        </form>

        <div className="border-b border-[#eadfc9]/80 bg-[#fffdf9] px-3 py-2 sm:px-4">
          <CollectionCategoryChips
            categories={categories}
            selectedCategory={selectedCategory}
            categoryCounts={categoryCounts}
            buildCategoryHref={buildCategoryHref}
          />
        </div>

        <div className="collection-mobile-toolbar__flow-pin">
          <CollectionSortFilterBar
            activeFilterCount={activeFilterCount}
            onSortClick={() => setSortOpen(true)}
            onFilterClick={() => setFiltersOpen(true)}
          />
          {hasActiveFilters ? (
            <div className="collection-filter-pills flex gap-2 overflow-x-auto bg-[#fffaf3] px-3 py-1.5">
              {activeFilterPills}
            </div>
          ) : null}
        </div>
      </div>

      <section
        className={`section-container collection-products-mobile py-2 sm:py-6 lg:py-5 ${
          showCompactBar ? 'has-compact-chrome' : ''
        }`}
        style={
          showCompactBar
            ? { '--collection-compact-pad': `${compactBarHeight}px` }
            : undefined
        }
      >
        {error ? (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center font-playfair text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {/* Desktop header — Myntra-style breadcrumbs + title (no hero) */}
        <header className="collection-myntra__header hidden lg:block">
          <nav aria-label="Breadcrumb" className="collection-myntra__breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden>/</span>
            <Link to="/collections">Collections</Link>
            {selectedCategory !== 'All' ? (
              <>
                <span aria-hidden>/</span>
                <span>{selectedCategory}</span>
              </>
            ) : null}
          </nav>
          <h1 className="collection-myntra__title">
            {pageTitle}
            <span className="collection-myntra__count">
              {loading ? '' : ` - ${sortedProducts.length} items`}
            </span>
          </h1>
        </header>

        <div className="collection-myntra__layout">
          <aside className="collection-myntra__sidebar hidden lg:block" aria-label="Product filters">
            <h2 className="collection-myntra__filters-heading">FILTERS</h2>

            <div className="collection-myntra__filter-section">
              <h3 className="collection-myntra__filter-label">CATEGORY</h3>
              <ul className="collection-myntra__filter-list">
                {categories.map((category) => {
                  const checked = selectedCategory === category
                  return (
                    <li key={category}>
                      <Link
                        to={buildCategoryHref(category)}
                        className={`collection-myntra__filter-option ${checked ? 'is-selected' : ''}`}
                      >
                        <span className="collection-myntra__checkbox" aria-hidden>
                          {checked ? <i className="fa-solid fa-check text-[10px]" /> : null}
                        </span>
                        <span className="collection-myntra__filter-option-label">{category}</span>
                        <span className="collection-myntra__filter-option-count">
                          ({categoryCounts[category] ?? 0})
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            <CollectionFilters variant="sidebar" {...filterPanelProps} />
          </aside>

          <div className="collection-myntra__main collection-main-content">
            <div className="collection-myntra__sortbar hidden lg:flex">
              <form onSubmit={handleListingSearch} className="collection-myntra__search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden />
                <input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search in this collection"
                  aria-label="Search products"
                />
              </form>
              <label className="collection-myntra__sort">
                <span className="collection-myntra__sort-prefix">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {hasActiveFilters ? (
              <div className="collection-myntra__active-filters hidden lg:flex">{activeFilterPills}</div>
            ) : null}

            <CollectionPageHeader
              title={pageTitle}
              productCount={sortedProducts.length}
              loading={loading}
              selectedCategory={selectedCategory}
            />
            {productGrid}
          </div>
        </div>
      </section>

      {/* Mobile sort sheet */}
      {sortOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Sort products">
          <button
            type="button"
            className="absolute inset-0 bg-[#1f1514]/50"
            aria-label="Close sort"
            onClick={() => setSortOpen(false)}
          />
          <div className="collection-filter-sheet absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border border-[#e3d1b4] bg-[#fffdf9] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-[#eadfc9] px-5 py-4">
              <h2 className="font-bodoni text-xl text-ink">Sort by</h2>
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4a7]"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>
            <ul className="px-3 py-2">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      handleSortChange(opt.value)
                      setSortOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 font-playfair text-sm ${
                      sortBy === opt.value ? 'bg-[#f5ead7] font-medium text-[#7a2c3a]' : 'text-ink'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.value ? (
                      <i className="fa-solid fa-check text-[#7a2c3a]" aria-hidden />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Mobile filter sheet */}
      {filtersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Product filters">
          <button
            type="button"
            className="absolute inset-0 bg-[#1f1514]/50"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="collection-filter-sheet absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[1.75rem] border border-[#e3d1b4] bg-[#fffdf9]">
            <div className="flex items-center justify-between border-b border-[#eadfc9] px-5 py-4">
              <h2 className="font-bodoni text-xl text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4a7]"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5" style={{ maxHeight: 'calc(88vh - 8.5rem)' }}>
              <h3 className="mb-3 font-bodoni text-base text-ink">Category</h3>
              <div className="mb-6 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={buildCategoryHref(category)}
                    onClick={() => setFiltersOpen(false)}
                    className={`rounded-full px-3 py-2 font-playfair text-sm ${
                      selectedCategory === category
                        ? 'bg-[#7a2c3a] text-white'
                        : 'border border-[#e3d1b4] bg-white text-muted'
                    }`}
                  >
                    {category}
                  </Link>
                ))}
              </div>
              <CollectionFilters {...filterPanelProps} />
            </div>
            <div className="border-t border-[#eadfc9] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setFiltersOpen(false)} className="lux-button w-full">
                Show {sortedProducts.length} products
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c19f] bg-white text-[#7a2c3a] shadow-md md:bottom-6 lg:bottom-6"
        aria-label="Scroll to top"
      >
        <i className="fa-solid fa-arrow-up text-sm" aria-hidden />
      </button>

      <Footer />
    </div>
  )
}

export default ProductListing
