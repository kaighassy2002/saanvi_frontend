import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createCatalogCollection,
  deleteCatalogCollection,
  listCatalogCollections,
  listProductsAll,
  updateCatalogCollection,
} from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import CollectionsEditor from './components/CollectionsEditor'

function AdminCollections() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [collections, allProducts] = await Promise.all([
        listCatalogCollections(authFetch),
        listProductsAll(authFetch),
      ])
      setRows(collections)
      setProducts(allProducts.filter((p) => p.published !== false))
    } catch (e) {
      setError(e?.message || 'Failed to load collections')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (body) => {
    setSaving(true)
    try {
      await createCatalogCollection(authFetch, body)
      toast('Collection created.')
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id, body) => {
    setSaving(true)
    try {
      await updateCatalogCollection(authFetch, id, body)
      toast('Collection updated.')
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCatalogCollection(authFetch, deleteTarget.id)
      setDeleteTarget(null)
      toast('Collection deleted.')
      await load()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const publishedCount = rows.filter((r) => r.published !== false).length

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Collections"
        description="Curate product groups for campaigns, seasonal edits, and featured shop pages."
      />

      <AdminErrorBanner message={error} onRetry={load} />

      {!loading && rows.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="rounded-lg border border-[#e8d5c0] bg-white px-4 py-2 text-sm">
            <span className="text-muted">Total</span>{' '}
            <span className="font-medium text-ink">{rows.length}</span>
          </div>
          <div className="rounded-lg border border-[#e8d5c0] bg-white px-4 py-2 text-sm">
            <span className="text-muted">Published</span>{' '}
            <span className="font-medium text-ink">{publishedCount}</span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <CollectionsEditor
          collections={rows}
          products={products}
          authFetch={authFetch}
          saving={saving}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={setDeleteTarget}
        />
      )}

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete collection"
        message={`Delete "${deleteTarget?.name}"? Products will not be removed from the catalog.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminCollections
