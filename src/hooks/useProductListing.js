import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG_UPDATED_EVENT, USE_LOCAL_API } from '../services/config'
import { useCatalog } from './useCatalog'
import { fetchProductListing, LISTING_PAGE_SIZE } from '../services/listingApi'
import { parseListingState } from '../services/listingSearchParams'
import { buildCollectionListing } from '../services/collectionListingSort'
import {
  buildBasicMaterialFacetOptions,
  buildColorFacetOptions,
  getProductMaterial,
  productMatchesColorFacet,
  productMatchesFacet,
} from '../services/collectionProductAttributes'
import { productIsInStock } from '../services/productVariants'
import { productMatchesSearch } from '../services/listingSearchParams'
import { fetchPublicCategoryTabs } from '../services/catalogService'

const EMPTY_FACETS = {
  priceBounds: { min: 0, max: 0 },
  categoryCounts: { All: 0 },
  categories: ['All'],
  inStockCount: 0,
  outOfStockCount: 0,
  colorOptions: [],
  materialOptions: [],
  productsCount: 0,
}

function filterProductsLocal(products, { selectedCategory, searchTerm, availability, priceRange, selectedColors, selectedMaterials }) {
  return products.filter((product) => {
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
  })
}

function buildLocalFacets(products, categories) {
  const prices = products.map((p) => Number(p.price) || 0)
  const priceBounds = {
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 0,
  }
  const categoryCounts = products.reduce(
    (acc, product) => {
      const key = product.category || 'Uncategorized'
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    { All: products.length }
  )
  const inStockCount = products.filter((p) => productIsInStock(p)).length
  return {
    priceBounds,
    categoryCounts,
    categories: categories.length ? categories : ['All'],
    inStockCount,
    outOfStockCount: products.length - inStockCount,
    colorOptions: buildColorFacetOptions(products),
    materialOptions: buildBasicMaterialFacetOptions(products),
    productsCount: products.length,
  }
}

/**
 * @param {URLSearchParams} searchParams
 * @param {{ featuredProductIds?: string[], pageSize?: number }} [options]
 */
export function useProductListing(searchParams, { featuredProductIds = [], pageSize = LISTING_PAGE_SIZE } = {}) {
  const { products: catalogProducts, loading: catalogLoading, error: catalogError } = useCatalog()

  const selectedCategory = searchParams.get('category') || 'All'
  const searchTerm = (searchParams.get('search') || '').trim()

  const [apiEntries, setApiEntries] = useState([])
  const [apiTotal, setApiTotal] = useState(0)
  const [apiFacets, setApiFacets] = useState(EMPTY_FACETS)
  const [apiPage, setApiPage] = useState(1)
  const [apiLoading, setApiLoading] = useState(!USE_LOCAL_API)
  const [apiLoadingMore, setApiLoadingMore] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [localVisibleCount, setLocalVisibleCount] = useState(pageSize)
  const [localCategories, setLocalCategories] = useState(['All'])
  const requestIdRef = useRef(0)

  const priceBoundsForParse = useMemo(() => {
    if (USE_LOCAL_API) {
      if (!catalogProducts.length) return { min: 0, max: 0 }
      const prices = catalogProducts.map((p) => Number(p.price) || 0)
      return { min: Math.min(...prices), max: Math.max(...prices) }
    }
    return apiFacets.priceBounds || EMPTY_FACETS.priceBounds
  }, [catalogProducts, apiFacets.priceBounds])

  const listingState = useMemo(
    () => parseListingState(searchParams, priceBoundsForParse),
    [searchParams, priceBoundsForParse.min, priceBoundsForParse.max]
  )

  const filterKey = useMemo(
    () =>
      [
        selectedCategory,
        searchTerm,
        listingState.sortBy,
        listingState.availability,
        listingState.priceRange.min,
        listingState.priceRange.max,
        listingState.selectedColors.join(','),
        listingState.selectedMaterials.join(','),
      ].join('|'),
    [selectedCategory, searchTerm, listingState]
  )

  const loadApiPage = useCallback(
    async (page, { append = false } = {}) => {
      const requestId = ++requestIdRef.current
      if (page === 1) setApiLoading(true)
      else setApiLoadingMore(true)
      setApiError(null)
      try {
        const data = await fetchProductListing(searchParams, page, pageSize)
        if (requestId !== requestIdRef.current) return
        const entries = Array.isArray(data?.entries) ? data.entries : []
        setApiEntries((prev) => (append ? [...prev, ...entries] : entries))
        setApiTotal(Number(data?.total) || 0)
        setApiPage(page)
        if (data?.facets) setApiFacets(data.facets)
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        setApiError(e?.message || 'Failed to load products')
        if (!append) {
          setApiEntries([])
          setApiTotal(0)
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setApiLoading(false)
          setApiLoadingMore(false)
        }
      }
    },
    [searchParams, pageSize]
  )

  useEffect(() => {
    if (USE_LOCAL_API) return undefined
    setApiPage(1)
    loadApiPage(1, { append: false })
    return undefined
  }, [filterKey, loadApiPage])

  useEffect(() => {
    if (USE_LOCAL_API) return undefined
    const onUpdate = () => loadApiPage(1, { append: false })
    window.addEventListener(CATALOG_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onUpdate)
  }, [loadApiPage])

  useEffect(() => {
    if (!USE_LOCAL_API) return undefined
    let cancelled = false
    fetchPublicCategoryTabs(catalogProducts).then((tabs) => {
      if (!cancelled) setLocalCategories(tabs.length ? tabs : ['All'])
    })
    return () => {
      cancelled = true
    }
  }, [catalogProducts])

  useEffect(() => {
    if (!USE_LOCAL_API) return
    setLocalVisibleCount(pageSize)
  }, [filterKey, pageSize])

  const localFiltered = useMemo(
    () =>
      filterProductsLocal(catalogProducts, {
        selectedCategory,
        searchTerm,
        availability: listingState.availability,
        priceRange: listingState.priceRange,
        selectedColors: listingState.selectedColors,
        selectedMaterials: listingState.selectedMaterials,
      }),
    [catalogProducts, selectedCategory, searchTerm, listingState]
  )

  const localListingEntries = useMemo(
    () =>
      buildCollectionListing(localFiltered, listingState.sortBy, {
        featuredProductIds,
      }),
    [localFiltered, listingState.sortBy, featuredProductIds]
  )

  const localFacets = useMemo(
    () => buildLocalFacets(catalogProducts, localCategories),
    [catalogProducts, localCategories]
  )

  const localVisibleEntries = useMemo(
    () => localListingEntries.slice(0, localVisibleCount),
    [localListingEntries, localVisibleCount]
  )

  const loadMore = useCallback(() => {
    if (USE_LOCAL_API) {
      setLocalVisibleCount((count) => Math.min(count + pageSize, localListingEntries.length))
      return
    }
    if (apiLoadingMore || apiLoading) return
    if (apiEntries.length >= apiTotal) return
    loadApiPage(apiPage + 1, { append: true })
  }, [
    apiEntries.length,
    apiLoading,
    apiLoadingMore,
    apiPage,
    apiTotal,
    loadApiPage,
    localListingEntries.length,
    pageSize,
  ])

  if (USE_LOCAL_API) {
    return {
      entries: localVisibleEntries,
      total: localListingEntries.length,
      facets: localFacets,
      categories: localFacets.categories,
      priceBounds: localFacets.priceBounds,
      categoryCounts: localFacets.categoryCounts,
      inStockCount: localFacets.inStockCount,
      outOfStockCount: localFacets.outOfStockCount,
      colorOptions: localFacets.colorOptions,
      materialOptions: localFacets.materialOptions,
      productsCount: localFacets.productsCount,
      loading: catalogLoading,
      loadingMore: false,
      error: catalogError,
      hasMore: localVisibleCount < localListingEntries.length,
      loadMore,
      listingState,
      filteredCount: localFiltered.length,
    }
  }

  return {
    entries: apiEntries,
    total: apiTotal,
    facets: apiFacets,
    categories: apiFacets.categories || ['All'],
    priceBounds: apiFacets.priceBounds || EMPTY_FACETS.priceBounds,
    categoryCounts: apiFacets.categoryCounts || EMPTY_FACETS.categoryCounts,
    inStockCount: apiFacets.inStockCount ?? 0,
    outOfStockCount: apiFacets.outOfStockCount ?? 0,
    colorOptions: apiFacets.colorOptions || [],
    materialOptions: apiFacets.materialOptions || [],
    productsCount: apiFacets.productsCount ?? 0,
    loading: apiLoading,
    loadingMore: apiLoadingMore,
    error: apiError,
    hasMore: apiEntries.length < apiTotal,
    loadMore,
    listingState,
    filteredCount: apiTotal,
  }
}
