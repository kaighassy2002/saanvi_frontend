import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  adjustStock,
  getAllStock,
  getLowStock,
  getStockMovements,
  submitStockTake,
} from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminErrorBanner from './components/AdminErrorBanner'

const TABS = [
  { id: 'all', label: 'All stock' },
  { id: 'low', label: 'Low stock' },
  { id: 'movements', label: 'Movements' },
  { id: 'take', label: 'Stock take' },
]

const MOVEMENT_LABELS = {
  adjust: 'Adjust',
  reserve: 'Reserve',
  release: 'Release',
  sale: 'Sale',
  restock: 'Restock',
  stock_take: 'Stock take',
  reorder_alert: 'Reorder alert',
}

function rowKey(row) {
  return `${row.productId}-${row.variantName || 'main'}`
}

function formatWhen(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InventoryTabs({ active, onChange }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-[#e8d5c0] pb-3">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            active === tab.id
              ? 'bg-[#7a2c3a] text-white'
              : 'bg-[#faf6f0] text-muted hover:bg-[#f0e6d6]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function AdjustModal({ row, onClose, onSaved }) {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [delta, setDelta] = useState('0')
  const [reason, setReason] = useState('manual')
  const [adjusting, setAdjusting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setAdjusting(true)
    try {
      await adjustStock(authFetch, {
        productId: row.productId,
        variantName: row.variantName || undefined,
        delta: Number(delta),
        reason: reason.trim() || 'manual',
      })
      toast('Stock updated.')
      onSaved()
      onClose()
    } catch (err) {
      toast(err?.message || 'Adjust failed', 'error')
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-[#e8d5c0] bg-white p-6">
        <h2 className="font-playfair text-lg text-ink">Adjust stock</h2>
        <p className="text-sm text-muted mt-1">
          {row.name}
          {row.variantName ? ` · ${row.variantName}` : ''}
        </p>
        <p className="text-xs text-muted mt-1">
          On hand {row.onHand ?? row.stock} · Reserved {row.reserved ?? 0} · Available{' '}
          {row.available ?? row.stock}
        </p>
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
          <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={adjusting} className="lux-button px-3 py-1.5 text-sm">
            {adjusting ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AllStockPanel({ items, loading, categories, filters, onFiltersChange, onAdjust }) {
  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'variant', label: 'Variant' },
    { key: 'category', label: 'Category' },
    { key: 'onHand', label: 'On hand' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'available', label: 'Available' },
    { key: 'actions', label: '' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm min-w-[200px]"
          placeholder="Search name, SKU…"
          value={filters.q}
          onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
        />
        <select
          className="rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
          value={filters.category}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
          value={filters.sort}
          onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value })}
        >
          <option value="category">Sort: Category</option>
          <option value="name">Sort: Name</option>
          <option value="available">Sort: Available (low first)</option>
          <option value="onHand">Sort: On hand (low first)</option>
        </select>
      </div>

      <AdminDataTable columns={columns} loading={loading} emptyMessage="No SKUs match your filters.">
        {items.map((row) => (
          <tr key={rowKey(row)} className="border-b border-[#f0e6d6] last:border-0">
            <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
            <td className="px-4 py-3 text-xs font-mono text-muted">{row.sku || '—'}</td>
            <td className="px-4 py-3 text-muted">{row.variantName || '—'}</td>
            <td className="px-4 py-3 text-muted">{row.category || '—'}</td>
            <td className="px-4 py-3">{row.onHand}</td>
            <td className="px-4 py-3 text-muted">{row.reserved}</td>
            <td className="px-4 py-3 font-medium">{row.available}</td>
            <td className="px-4 py-3 space-x-2">
              <button
                type="button"
                onClick={() => onAdjust(row)}
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
    </div>
  )
}

function LowStockPanel({ items, loading, onAdjust }) {
  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'variant', label: 'Variant' },
    { key: 'available', label: 'Available' },
    { key: 'onHand', label: 'On hand' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'threshold', label: 'Threshold' },
    { key: 'actions', label: '' },
  ]

  return (
    <AdminDataTable
      columns={columns}
      loading={loading}
      emptyMessage="No low-stock items. All SKUs are above their alert thresholds."
    >
      {items.map((row) => (
        <tr
          key={rowKey(row)}
          className="border-b border-[#f0e6d6] last:border-0 bg-amber-50/40"
        >
          <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
          <td className="px-4 py-3 text-xs font-mono text-muted">{row.sku || '—'}</td>
          <td className="px-4 py-3 text-muted">{row.variantName || '—'}</td>
          <td className="px-4 py-3 font-medium text-amber-900">{row.available ?? row.stock}</td>
          <td className="px-4 py-3 text-muted">{row.onHand ?? '—'}</td>
          <td className="px-4 py-3 text-muted">{row.reserved ?? 0}</td>
          <td className="px-4 py-3 text-muted">{row.threshold}</td>
          <td className="px-4 py-3 space-x-2">
            <button
              type="button"
              onClick={() => onAdjust(row)}
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
  )
}

function MovementsPanel({ movements, loading, filter, onFilterChange }) {
  const columns = [
    { key: 'when', label: 'When' },
    { key: 'type', label: 'Type' },
    { key: 'product', label: 'Product' },
    { key: 'variant', label: 'Variant' },
    { key: 'delta', label: 'Δ' },
    { key: 'after', label: 'On hand after' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'reason', label: 'Reason / Order' },
    { key: 'by', label: 'By' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
          value={filter.movementType}
          onChange={(e) => onFilterChange({ ...filter, movementType: e.target.value })}
        >
          <option value="">All movement types</option>
          {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <AdminDataTable columns={columns} loading={loading} emptyMessage="No stock movements recorded yet.">
        {movements.map((m) => (
          <tr key={m.id || m._id} className="border-b border-[#f0e6d6] last:border-0">
            <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{formatWhen(m.createdAt)}</td>
            <td className="px-4 py-3 text-xs">
              <span className="rounded bg-[#faf6f0] px-2 py-0.5">
                {MOVEMENT_LABELS[m.movementType] || m.movementType || 'Adjust'}
              </span>
            </td>
            <td className="px-4 py-3 text-sm">{m.productName || m.productId}</td>
            <td className="px-4 py-3 text-muted text-sm">{m.variantName || '—'}</td>
            <td className="px-4 py-3 font-mono text-sm">
              {m.delta > 0 ? `+${m.delta}` : m.delta}
            </td>
            <td className="px-4 py-3 text-sm">{m.stockAfter}</td>
            <td className="px-4 py-3 text-sm text-muted">{m.reservedAfter ?? 0}</td>
            <td className="px-4 py-3 text-xs text-muted max-w-[200px]">
              {m.reason || '—'}
              {m.orderId ? (
                <span className="block text-ink mt-0.5">Order {m.orderId}</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-xs text-muted">{m.adminEmail || 'system'}</td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  )
}

function StockTakePanel({ items, loading, onReload }) {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [counts, setCounts] = useState({})
  const [note, setNote] = useState('Physical stock count')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const next = {}
    for (const row of items) {
      next[rowKey(row)] = String(row.onHand)
    }
    setCounts(next)
  }, [items])

  const changedLines = useMemo(() => {
    return items
      .filter((row) => {
        const key = rowKey(row)
        const counted = Number(counts[key])
        return Number.isFinite(counted) && counted !== row.onHand
      })
      .map((row) => ({
        productId: row.productId,
        variantName: row.variantName || '',
        counted: Number(counts[rowKey(row)]),
        name: row.name,
        variantLabel: row.variantName,
      }))
  }, [items, counts])

  const submit = async (e) => {
    e.preventDefault()
    if (changedLines.length === 0) {
      toast('No counts changed.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const result = await submitStockTake(authFetch, {
        note: note.trim() || 'Physical stock count',
        lines: changedLines.map(({ productId, variantName, counted }) => ({
          productId,
          variantName,
          counted,
        })),
      })
      toast(`Stock take saved — ${result?.adjusted ?? changedLines.length} SKU(s) adjusted.`)
      await onReload()
    } catch (err) {
      toast(err?.message || 'Stock take failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'variant', label: 'Variant' },
    { key: 'onHand', label: 'System on hand' },
    { key: 'counted', label: 'Counted' },
    { key: 'diff', label: 'Diff' },
  ]

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">
        Enter physical counts after a festival or audit. Only rows with a different count are saved to
        the movement log.
      </p>
      <input
        className="w-full max-w-md rounded-lg border border-[#e8d5c0] px-3 py-2 text-sm"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note for audit trail"
      />

      <AdminDataTable columns={columns} loading={loading} emptyMessage="Load stock SKUs first.">
        {items.map((row) => {
          const key = rowKey(row)
          const counted = Number(counts[key])
          const diff = Number.isFinite(counted) ? counted - row.onHand : 0
          return (
            <tr key={key} className="border-b border-[#f0e6d6] last:border-0">
              <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
              <td className="px-4 py-3 text-muted">{row.variantName || '—'}</td>
              <td className="px-4 py-3">{row.onHand}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0"
                  className="w-24 rounded-lg border border-[#e8d5c0] px-2 py-1 text-sm"
                  value={counts[key] ?? ''}
                  onChange={(e) => setCounts((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </td>
              <td
                className={`px-4 py-3 font-mono text-sm ${
                  diff !== 0 ? (diff > 0 ? 'text-green-800' : 'text-amber-900') : 'text-muted'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff}
              </td>
            </tr>
          )
        })}
      </AdminDataTable>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {changedLines.length} SKU(s) will be reconciled
        </p>
        <button type="submit" disabled={submitting || changedLines.length === 0} className="lux-button px-4 py-2 text-sm">
          {submitting ? 'Saving…' : 'Save stock take'}
        </button>
      </div>
    </form>
  )
}

function AdminInventory() {
  const { authFetch } = useAdminAuth()
  const [tab, setTab] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [allItems, setAllItems] = useState([])
  const [categories, setCategories] = useState([])
  const [lowItems, setLowItems] = useState([])
  const [movements, setMovements] = useState([])
  const [adjustRow, setAdjustRow] = useState(null)
  const [stockFilters, setStockFilters] = useState({ q: '', category: '', sort: 'category' })
  const [movementFilter, setMovementFilter] = useState({ movementType: '' })

  const loadAllStock = useCallback(async () => {
    const params = {}
    if (stockFilters.category) params.category = stockFilters.category
    if (stockFilters.q.trim()) params.q = stockFilters.q.trim()
    if (stockFilters.sort) params.sort = stockFilters.sort
    const data = await getAllStock(authFetch, params)
    setAllItems(data.items)
    setCategories(data.categories)
    return data.items
  }, [authFetch, stockFilters])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      if (tab === 'all' || tab === 'take') {
        await loadAllStock()
      } else if (tab === 'low') {
        setLowItems(await getLowStock(authFetch))
      } else if (tab === 'movements') {
        const params = {}
        if (movementFilter.movementType) params.movementType = movementFilter.movementType
        setMovements(await getStockMovements(authFetch, params))
      }
    } catch (e) {
      setError(e?.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [authFetch, tab, loadAllStock, movementFilter.movementType])

  useEffect(() => {
    load()
  }, [load])

  const descriptions = {
    all: 'Every SKU with on-hand, reserved, and sellable available units.',
    low: 'SKUs at or below their reorder threshold (based on available stock).',
    movements: 'Audit trail — who changed counts, reservations, sales, and stock takes.',
    take: 'Reconcile system counts after a physical inventory check.',
  }

  return (
    <div>
      <AdminPageHeader title="Inventory" description={descriptions[tab]} />

      <InventoryTabs active={tab} onChange={setTab} />

      <AdminErrorBanner message={error} onRetry={load} />

      {tab === 'all' ? (
        <AllStockPanel
          items={allItems}
          loading={loading}
          categories={categories}
          filters={stockFilters}
          onFiltersChange={setStockFilters}
          onAdjust={setAdjustRow}
        />
      ) : null}

      {tab === 'low' ? (
        <LowStockPanel items={lowItems} loading={loading} onAdjust={setAdjustRow} />
      ) : null}

      {tab === 'movements' ? (
        <MovementsPanel
          movements={movements}
          loading={loading}
          filter={movementFilter}
          onFilterChange={setMovementFilter}
        />
      ) : null}

      {tab === 'take' ? (
        <StockTakePanel items={allItems} loading={loading} onReload={loadAllStock} />
      ) : null}

      {adjustRow ? (
        <AdjustModal
          row={adjustRow}
          onClose={() => setAdjustRow(null)}
          onSaved={load}
        />
      ) : null}
    </div>
  )
}

export default AdminInventory
