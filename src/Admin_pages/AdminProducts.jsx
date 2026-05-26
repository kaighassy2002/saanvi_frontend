import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { deleteProduct, listProducts } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function AdminProducts() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setProducts(await listProducts(authFetch))
    } catch (e) {
      setError(e?.message || 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.category || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(authFetch, deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e) {
      setError(e?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'image', label: '' },
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage catalog items shown on the storefront."
        action={{ label: 'Add product', to: '/admin/products/new' }}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <input
        type="search"
        placeholder="Search by name or category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm"
      />

      <AdminDataTable
        columns={columns}
        loading={loading}
        emptyMessage={search ? 'No products match your search.' : 'No products yet. Add your first product.'}
      >
        {filtered.map((p) => (
          <tr key={p.id} className="border-b border-[#f0e6d6] last:border-0">
            <td className="px-4 py-3">
              {p.image ? (
                <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="h-10 w-10 rounded bg-[#f4e8db]" />
              )}
            </td>
            <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
            <td className="px-4 py-3 text-muted">{p.category}</td>
            <td className="px-4 py-3">{formatPrice(p.price)}</td>
            <td className="px-4 py-3">{p.stock ?? '—'}</td>
            <td className="px-4 py-3">
              <span
                className={`text-xs ${p.published !== false ? 'text-emerald-700' : 'text-muted'}`}
              >
                {p.published !== false ? 'Published' : 'Draft'}
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
                  onClick={() => setDeleteTarget(p)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

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
