import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  bulkProducts,
  deleteProduct,
  downloadProductsExport,
  duplicateProduct,
  getCategories,
  importProductsCsv,
  listProducts,
} from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminPagination from './components/AdminPagination'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import { productImageUrl } from '../utils/cloudinaryImage'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function AdminProducts() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const { toast } = useAdminToast()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [published, setPublished] = useState('')
  const [stock, setStock] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState(null)
  const fileInputRef = React.useRef(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [result, cats] = await Promise.all([
        listProducts(authFetch, {
          page,
          limit: 20,
          q: search.trim() || undefined,
          category: category || undefined,
          published: published || undefined,
          stock: stock || undefined,
        }),
        getCategories(authFetch),
      ])
      setItems(result.items)
      setTotal(result.total)
      setPages(result.pages)
      setCategories(cats)
      setSelected(new Set())
    } catch (e) {
      setError(e?.message || 'Failed to load products')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [authFetch, page, search, category, published, stock])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, category, published, stock])

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map((p) => p.id)))
  }

  const runBulk = async (action) => {
    const ids = [...selected]
    if (!ids.length) return
    setBulkBusy(true)
    try {
      await bulkProducts(authFetch, ids, action)
      toast(`Bulk ${action} applied to ${ids.length} product(s).`)
      await load()
    } catch (e) {
      toast(e?.message || 'Bulk action failed', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  const handleExport = async () => {
    try {
      const csv = await downloadProductsExport()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'products.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast('Products exported.')
    } catch (e) {
      toast(e?.message || 'Export failed', 'error')
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportBusy(true)
    try {
      const csv = await file.text()
      const result = await importProductsCsv(authFetch, csv)
      const msg = `Import done: ${result.created} created, ${result.updated} updated.`
      toast(result.errors?.length ? `${msg} ${result.errors.length} issue(s).` : msg)
      if (result.errors?.length) console.warn('Import errors:', result.errors)
      await load()
    } catch (err) {
      toast(err?.message || 'Import failed', 'error')
    } finally {
      setImportBusy(false)
      e.target.value = ''
    }
  }

  const handleDuplicate = async (productId) => {
    setDuplicatingId(productId)
    try {
      const copy = await duplicateProduct(authFetch, productId)
      toast('Product duplicated as draft.')
      navigate(`/admin/products/${encodeURIComponent(copy.id)}/edit`)
    } catch (e) {
      toast(e?.message || 'Duplicate failed', 'error')
    } finally {
      setDuplicatingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(authFetch, deleteTarget.id)
      setDeleteTarget(null)
      toast('Product deleted.')
      await load()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'select', label: '' },
    { key: 'image', label: '' },
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]

  const inputClass =
    'rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage catalog items shown on the storefront."
        action={{ label: 'Add product', to: '/admin/products/new' }}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-[#d8c4a7] bg-white px-3 py-2 text-xs hover:bg-[#f7ecee]"
        >
          Export CSV
        </button>
        <button
          type="button"
          disabled={importBusy}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-[#d8c4a7] bg-white px-3 py-2 text-xs hover:bg-[#f7ecee] disabled:opacity-60"
        >
          {importBusy ? 'Importing…' : 'Import CSV'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportFile}
        />
        <input
          type="search"
          placeholder="Search name, SKU, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-full max-w-xs`}
        />
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className={inputClass} value={published} onChange={(e) => setPublished(e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <select className={inputClass} value={stock} onChange={(e) => setStock(e.target.value)}>
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {selected.size > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-[#e8d5c0] bg-white px-4 py-3">
          <span className="text-xs text-muted self-center">{selected.size} selected</span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulk('publish')}
            className="rounded border border-[#d8c4a7] px-2 py-1 text-xs hover:bg-[#f7ecee]"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulk('unpublish')}
            className="rounded border border-[#d8c4a7] px-2 py-1 text-xs hover:bg-[#f7ecee]"
          >
            Unpublish
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => runBulk('feature')}
            className="rounded border border-[#d8c4a7] px-2 py-1 text-xs hover:bg-[#f7ecee]"
          >
            Feature
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
        <AdminDataTable
          columns={columns}
          loading={loading}
          emptyMessage="No products match your filters."
        >
          {items.map((p) => {
            const threshold = p.lowStockThreshold != null ? Number(p.lowStockThreshold) : 5
            const isLow = Number(p.stock) <= threshold
            return (
              <tr
                key={p.id}
                className={`border-b border-[#f0e6d6] last:border-0 ${isLow ? 'bg-amber-50/50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  {p.image ? (
                    <img
                      src={productImageUrl(p.image, 'thumb')}
                      alt=""
                      className="h-12 w-10 rounded bg-[#f8f2e7] object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-[#f4e8db]" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{p.name}</p>
                  {p.featured ? (
                    <span className="text-[10px] text-gold-dark">Featured</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-muted">{p.sku || '—'}</td>
                <td className="px-4 py-3 text-muted">{p.category}</td>
                <td className="px-4 py-3">{formatPrice(p.price)}</td>
                <td className="px-4 py-3">
                  <span className={isLow ? 'text-amber-800 font-medium' : ''}>{p.stock ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs ${p.published !== false ? 'text-emerald-700' : 'text-muted'}`}
                  >
                    {p.publishAt && new Date(p.publishAt) > new Date()
                      ? 'Scheduled'
                      : p.published !== false
                        ? 'Published'
                        : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                      className="rounded-lg border border-[#d8c4a7] px-2 py-1 text-xs hover:bg-[#f7ecee]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={duplicatingId === p.id}
                      onClick={() => handleDuplicate(p.id)}
                      className="rounded-lg border border-[#d8c4a7] px-2 py-1 text-xs hover:bg-[#f7ecee] disabled:opacity-60"
                    >
                      {duplicatingId === p.id ? '…' : 'Duplicate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </AdminDataTable>
        <div className="px-4 py-2 border-t border-[#f0e6d6] flex items-center gap-2">
          <input
            type="checkbox"
            checked={items.length > 0 && selected.size === items.length}
            onChange={toggleAll}
            className="mr-2"
          />
          <span className="text-xs text-muted">Select all on page</span>
        </div>
        <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete product"
        message={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminProducts
