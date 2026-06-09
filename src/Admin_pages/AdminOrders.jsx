import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  bulkOrders,
  downloadOrdersExport,
  getOrder,
  listOrders,
} from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminPagination from './components/AdminPagination'
import AdminStatusBadge, { PAYMENT_STATUS_OPTIONS } from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'
import BulkPackingSlipsPrint from './components/BulkPackingSlipsPrint'
import { useAdminToast } from './shared/AdminToastProvider'

const FILTER_OPTIONS = [
  'All',
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
  'Return Requested',
  'Returned',
]

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function isCodOrder(o) {
  const key = String(o.paymentMethod || '').toLowerCase()
  return key === 'cod'
}

function AdminOrders() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const { toast } = useAdminToast()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'All'
  const initialCod = searchParams.get('codPending') === '1'

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(initialCod ? 'cod' : 'All')
  const [codPendingOnly, setCodPendingOnly] = useState(initialCod)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [printOrders, setPrintOrders] = useState([])

  const listParams = useCallback(
    () => ({
      page,
      limit: 20,
      q: search.trim() || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      paymentStatus: paymentFilter !== 'All' ? paymentFilter : undefined,
      paymentMethod: paymentMethodFilter !== 'All' ? paymentMethodFilter : undefined,
      codPending: codPendingOnly ? '1' : undefined,
    }),
    [page, search, statusFilter, paymentFilter, paymentMethodFilter, codPendingOnly]
  )

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const result = await listOrders(authFetch, listParams())
      setItems(result.items)
      setTotal(result.total)
      setPages(result.pages)
      setSelected(new Set())
    } catch (e) {
      setError(e?.message || 'Failed to load orders')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [authFetch, listParams])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, paymentFilter, paymentMethodFilter, codPendingOnly])

  useEffect(() => {
    if (searchParams.get('codPending') === '1') {
      setCodPendingOnly(true)
      setPaymentMethodFilter('cod')
    }
    const urlStatus = searchParams.get('status')
    if (urlStatus) setStatusFilter(urlStatus)
  }, [searchParams])

  const handleExport = async () => {
    try {
      const blob = await downloadOrdersExport(listParams())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'orders.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast('Orders exported (current filters).')
    } catch (e) {
      toast(e?.message || 'Export failed', 'error')
    }
  }

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
    else setSelected(new Set(items.map((o) => o.id)))
  }

  const runBulk = async (action) => {
    const ids = [...selected]
    if (!ids.length) return
    setBulkBusy(true)
    try {
      const result = await bulkOrders(authFetch, ids, action)
      const failed = result.failed?.length || 0
      toast(
        failed
          ? `Updated ${result.updated}; ${failed} failed.`
          : `Bulk action applied to ${result.updated} order(s).`,
        failed ? 'error' : 'success'
      )
      await load()
    } catch (e) {
      toast(e?.message || 'Bulk action failed', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  const bulkPrintSlips = async () => {
    const ids = [...selected]
    if (!ids.length) return
    setBulkBusy(true)
    try {
      const orders = await Promise.all(ids.map((id) => getOrder(authFetch, id)))
      setPrintOrders(orders)
      requestAnimationFrame(() => {
        window.print()
        setTimeout(() => setPrintOrders([]), 500)
      })
    } catch (e) {
      toast(e?.message || 'Could not load orders for print', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  const columns = [
    { key: 'select', label: '' },
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'payment', label: 'Payment' },
    { key: 'date', label: 'Date' },
  ]

  return (
    <div>
      <BulkPackingSlipsPrint orders={printOrders} />

      <AdminPageHeader
        title="Orders"
        description="View and fulfill customer orders."
        action={{ label: 'Export CSV', onClick: handleExport }}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search order ID, email, phone, RMA…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm w-full max-w-xs"
        />
        <select
          value={paymentMethodFilter}
          onChange={(e) => {
            setPaymentMethodFilter(e.target.value)
            if (e.target.value !== 'cod') setCodPendingOnly(false)
          }}
          className="rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm"
        >
          <option value="All">All payment methods</option>
          <option value="cod">COD only</option>
          <option value="razorpay">Prepaid only</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={codPendingOnly}
            onChange={(e) => {
              setCodPendingOnly(e.target.checked)
              if (e.target.checked) setPaymentMethodFilter('cod')
            }}
          />
          COD awaiting confirmation
        </label>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <span className="text-xs text-muted self-center mr-1">Order:</span>
        {FILTER_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              statusFilter === s
                ? 'bg-[#f4e8db] text-ink font-medium'
                : 'border border-[#e8d5c0] text-muted hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-xs text-muted self-center mr-1">Payment:</span>
        <button
          type="button"
          onClick={() => setPaymentFilter('All')}
          className={`rounded-full px-3 py-1 text-xs transition ${
            paymentFilter === 'All'
              ? 'bg-[#f4e8db] text-ink font-medium'
              : 'border border-[#e8d5c0] text-muted hover:text-ink'
          }`}
        >
          All
        </button>
        {PAYMENT_STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPaymentFilter(s)}
            className={`rounded-full px-3 py-1 text-xs transition capitalize ${
              paymentFilter === s
                ? 'bg-[#f4e8db] text-ink font-medium'
                : 'border border-[#e8d5c0] text-muted hover:text-ink'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {selected.size > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-[#e8d5c0] bg-white px-4 py-3">
          <span className="text-xs text-muted self-center">{selected.size} selected</span>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk('confirm')} className="admin-quick-action text-xs">
            Confirm
          </button>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk('confirm_cod')} className="admin-quick-action text-xs">
            Confirm COD
          </button>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk('mark_packed')} className="admin-quick-action text-xs">
            Mark packed
          </button>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk('mark_shipped')} className="admin-quick-action text-xs">
            Mark shipped
          </button>
          <button type="button" disabled={bulkBusy} onClick={bulkPrintSlips} className="admin-quick-action text-xs">
            Print slips
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
        <AdminDataTable
          columns={columns}
          loading={loading}
          emptyMessage={statusFilter === 'All' ? 'No orders yet.' : `No orders with status "${statusFilter}".`}
        >
          {items.map((o) => (
            <tr
              key={o.id}
              className="border-b border-[#f0e6d6] last:border-0 hover:bg-[#faf7f2]"
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} />
              </td>
              <td
                className="px-4 py-3 font-mono text-xs cursor-pointer"
                onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}
              >
                {o.id}
                {isCodOrder(o) && !o.codConfirmedAt ? (
                  <span className="ml-1 text-[10px] text-[#9f7a2c]">COD</span>
                ) : null}
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}>
                <p className="text-ink">{o.customerName || '—'}</p>
                <p className="text-xs text-muted">{o.customerEmail || ''}</p>
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}>
                {formatPrice(o.total)}
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}>
                <AdminStatusBadge status={o.status} />
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}>
                <AdminStatusBadge status={o.paymentStatus} />
              </td>
              <td className="px-4 py-3 text-muted cursor-pointer" onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}>
                {o.date || '—'}
              </td>
            </tr>
          ))}
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
    </div>
  )
}

export default AdminOrders
