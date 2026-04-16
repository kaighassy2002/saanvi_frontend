import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATALOG_UPDATED_EVENT } from '../services/config'
import { adminDeleteProduct, adminFetchProducts, adminSaveProduct } from '../services/catalogService'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortKey, setSortKey] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])
  const initialLoadRef = useRef(true)

  const load = useCallback(async () => {
    setError('')
    if (initialLoadRef.current) setLoading(true)
    else setRefreshing(true)
    try {
      const list = await adminFetchProducts()
      setProducts(list)
    } catch (e) {
      setError(e?.message || 'Failed to load products')
    } finally {
      if (initialLoadRef.current) {
        initialLoadRef.current = false
        setLoading(false)
      }
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onCat = () => load()
    window.addEventListener(CATALOG_UPDATED_EVENT, onCat)
    return () => window.removeEventListener(CATALOG_UPDATED_EVENT, onCat)
  }, [load])

  const categories = useMemo(() => {
    const s = new Set(products.map((p) => p.category).filter(Boolean))
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (!q) return true
      const name = String(p.name || '').toLowerCase()
      const cat = String(p.category || '').toLowerCase()
      return name.includes(q) || cat.includes(q)
    })
  }, [products, search, categoryFilter])

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts]
    if (sortKey === 'priceLowHigh') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    } else if (sortKey === 'priceHighLow') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    } else if (sortKey === 'stockLowHigh') {
      list.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    } else if (sortKey === 'nameAZ') {
      list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    } else if (sortKey === 'nameZA') {
      list.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')))
    }
    return list
  }, [filteredProducts, sortKey])

  const pageCount = Math.max(1, Math.ceil(sortedProducts.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedProducts.slice(start, start + pageSize)
  }, [sortedProducts, currentPage, pageSize])

  const stats = useMemo(() => {
    const total = products.length
    const live = products.filter((p) => p.published !== false).length
    const lowStock = products.filter((p) => Number(p.stock || 0) <= 3).length
    return { total, live, lowStock }
  }, [products])

  const allVisibleIds = useMemo(() => paginatedProducts.map((p) => String(p.id)), [paginatedProducts])
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))

  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, sortKey, pageSize])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  function toggleOneSelected(id) {
    const sid = String(id)
    setSelectedIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]))
  }

  function toggleSelectVisible() {
    setSelectedIds((prev) => {
      if (allVisibleIds.length === 0) return prev
      if (allVisibleIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !allVisibleIds.includes(id))
      }
      return [...new Set([...prev, ...allVisibleIds])]
    })
  }

  async function applyBulkPublished(nextPublished) {
    if (selectedIds.length === 0) return
    setBulkBusy(true)
    setError('')
    try {
      await Promise.all(selectedIds.map((id) => adminSaveProduct({ id, published: nextPublished })))
      setSelectedIds([])
      await load()
    } catch (e) {
      setError(e?.message || 'Bulk update failed')
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this product from the catalogue?')) return
    setDeleting(id)
    try {
      await adminDeleteProduct(id)
      await load()
    } catch (e) {
      setError(e?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePublished(p) {
    const nextPublished = p.published === false
    setTogglingId(p.id)
    setError('')
    try {
      await adminSaveProduct({ id: p.id, published: nextPublished })
      await load()
    } catch (e) {
      setError(e?.message || 'Could not update product')
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) return <p className="font-playfair text-muted">Loading products…</p>

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="lux-card p-4">
          <p className="text-overline text-xs">Total products</p>
          <p className="mt-1 font-bodoni text-2xl text-ink">{stats.total}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-overline text-xs">Published</p>
          <p className="mt-1 font-bodoni text-2xl text-ink">{stats.live}</p>
        </div>
        <div className="lux-card p-4">
          <p className="text-overline text-xs">Low stock (≤3)</p>
          <p className="mt-1 font-bodoni text-2xl text-[#7a2c3a]">{stats.lowStock}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-bodoni text-3xl text-ink">Products</h2>
          <p className="font-playfair text-sm text-muted">Create, publish, and manage inventory</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => load()}
            className="rounded-full border border-[#d6c0a2] bg-white px-4 py-2 font-playfair text-sm text-ink hover:border-[#7a2c3a] disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/admin/products/new" className="lux-button text-sm">
            Add product
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full flex-1 sm:min-w-[200px]">
          <label className="form-label" htmlFor="admin-prod-search">
            Search
          </label>
          <input
            id="admin-prod-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or category"
            className="royal-input w-full"
          />
        </div>
        <div className="w-full sm:min-w-[160px] sm:w-auto">
          <label className="form-label" htmlFor="admin-prod-cat">
            Category
          </label>
          <select
            id="admin-prod-cat"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="royal-input w-full"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:min-w-[180px] sm:w-auto">
          <label className="form-label" htmlFor="admin-prod-sort">
            Sort
          </label>
          <select
            id="admin-prod-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="royal-input w-full"
          >
            <option value="newest">Newest first</option>
            <option value="priceLowHigh">Price: Low to high</option>
            <option value="priceHighLow">Price: High to low</option>
            <option value="stockLowHigh">Stock: Low to high</option>
            <option value="nameAZ">Name: A to Z</option>
            <option value="nameZA">Name: Z to A</option>
          </select>
        </div>
        <div className="w-full sm:min-w-[140px] sm:w-auto">
          <label className="form-label" htmlFor="admin-prod-page-size">
            Per page
          </label>
          <select
            id="admin-prod-page-size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="royal-input w-full"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-playfair text-sm text-muted">
          {selectedIds.length} selected
        </span>
        <button
          type="button"
          disabled={bulkBusy || selectedIds.length === 0}
          onClick={() => applyBulkPublished(true)}
          className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 font-playfair text-sm text-ink hover:border-[#7a2c3a] disabled:opacity-50"
        >
          Publish selected
        </button>
        <button
          type="button"
          disabled={bulkBusy || selectedIds.length === 0}
          onClick={() => applyBulkPublished(false)}
          className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 font-playfair text-sm text-ink hover:border-[#7a2c3a] disabled:opacity-50"
        >
          Unpublish selected
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
      ) : null}

      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left font-playfair text-sm">
            <thead className="bg-[#f8f1e6]/90 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectVisible}
                    aria-label="Select all visible products"
                  />
                </th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Live</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="border-t border-[#eadfc9]">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(String(p.id))}
                      onChange={() => toggleOneSelected(p.id)}
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <img
                      src={p.image}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-2 text-muted">{p.category}</td>
                  <td className="px-4 py-2">₹{Number(p.price).toLocaleString()}</td>
                  <td className="px-4 py-2">{p.stock}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={togglingId === p.id}
                      onClick={() => handleTogglePublished(p)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        p.published !== false
                          ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                          : 'bg-[#f0e6dc] text-muted hover:bg-[#e8dcc8]'
                      }`}
                      title={p.published !== false ? 'Click to unpublish' : 'Click to publish'}
                    >
                      {togglingId === p.id ? '…' : p.published !== false ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/admin/products/${p.id}`}
                      className="mr-3 text-[#7a2c3a] hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={deleting === p.id}
                      onClick={() => handleDelete(p.id)}
                      className="text-red-800/80 hover:underline disabled:opacity-50"
                    >
                      {deleting === p.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 ? (
          <p className="py-12 text-center font-playfair text-muted">No products. Add one to get started.</p>
        ) : sortedProducts.length === 0 ? (
          <p className="py-12 text-center font-playfair text-muted">No matches. Adjust search or category.</p>
        ) : null}
      </div>

      {sortedProducts.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-playfair text-sm text-muted">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, sortedProducts.length)} of {sortedProducts.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-playfair text-sm text-muted">
              Page {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
