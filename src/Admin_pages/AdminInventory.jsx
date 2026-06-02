import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { adjustStock, getLowStock } from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminErrorBanner from './components/AdminErrorBanner'

function AdminInventory() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adjustRow, setAdjustRow] = useState(null)
  const [delta, setDelta] = useState('0')
  const [reason, setReason] = useState('manual')
  const [adjusting, setAdjusting] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setItems(await getLowStock(authFetch))
    } catch (e) {
      setError(e?.message || 'Failed to load inventory')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const submitAdjust = async (e) => {
    e.preventDefault()
    if (!adjustRow) return
    setAdjusting(true)
    try {
      await adjustStock(authFetch, {
        productId: adjustRow.productId,
        variantName: adjustRow.variantName || undefined,
        delta: Number(delta),
        reason: reason.trim() || 'manual',
      })
      toast('Stock updated.')
      setAdjustRow(null)
      setDelta('0')
      await load()
    } catch (err) {
      toast(err?.message || 'Adjust failed', 'error')
    } finally {
      setAdjusting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'variant', label: 'Variant' },
    { key: 'stock', label: 'Stock' },
    { key: 'threshold', label: 'Threshold' },
    { key: 'actions', label: '' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Products and variants at or below their low-stock threshold."
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <AdminDataTable
        columns={columns}
        loading={loading}
        emptyMessage="No low-stock items. All products are above their alert thresholds."
      >
        {items.map((row, i) => (
          <tr key={`${row.productId}-${row.variantName || 'main'}-${i}`} className="border-b border-[#f0e6d6] last:border-0 bg-amber-50/40">
            <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
            <td className="px-4 py-3 text-xs font-mono text-muted">{row.sku || '—'}</td>
            <td className="px-4 py-3 text-muted">{row.variantName || '—'}</td>
            <td className="px-4 py-3 font-medium text-amber-900">{row.stock}</td>
            <td className="px-4 py-3 text-muted">{row.threshold}</td>
            <td className="px-4 py-3 space-x-2">
              <button
                type="button"
                onClick={() => setAdjustRow(row)}
                className="text-xs text-[#7a2c3a] hover:underline"
              >
                Adjust
              </button>
              <Link
                to={`/admin/products/${row.productId}/edit`}
                className="text-xs text-muted hover:underline"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      {adjustRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitAdjust} className="w-full max-w-sm rounded-xl border border-[#e8d5c0] bg-white p-6">
            <h2 className="font-playfair text-lg text-ink">Adjust stock</h2>
            <p className="text-sm text-muted mt-1">{adjustRow.name}{adjustRow.variantName ? ` · ${adjustRow.variantName}` : ''}</p>
            <p className="text-xs text-muted">Current: {adjustRow.stock}</p>
            <input
              type="number"
              className="mt-4 w-full rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="Delta (+/-)"
              required
            />
            <input
              className="mt-2 w-full rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setAdjustRow(null)} className="rounded-lg border px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={adjusting} className="lux-button px-3 py-1.5 text-sm">
                {adjusting ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default AdminInventory
