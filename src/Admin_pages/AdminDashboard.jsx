import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CATALOG_UPDATED_EVENT,
  ORDERS_UPDATED_EVENT,
} from '../services/config'
import { adminFetchProducts } from '../services/catalogService'
import { adminFetchOrders } from '../services/orderService'

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const initialLoadRef = useRef(true)

  const loadAll = useCallback(async () => {
    setError('')
    const blocking = initialLoadRef.current
    if (!blocking) setRefreshing(true)
    try {
      const [p, o] = await Promise.all([adminFetchProducts(), adminFetchOrders()])
      setProducts(p)
      setOrders(o)
    } catch (e) {
      setError(e?.message || 'Failed to load dashboard')
      setProducts([])
      setOrders([])
    } finally {
      if (blocking) {
        initialLoadRef.current = false
        setLoading(false)
      }
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const onRefresh = () => loadAll()
    window.addEventListener(CATALOG_UPDATED_EVENT, onRefresh)
    window.addEventListener(ORDERS_UPDATED_EVENT, onRefresh)
    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, onRefresh)
      window.removeEventListener(ORDERS_UPDATED_EVENT, onRefresh)
    }
  }, [loadAll])

  const stats = useMemo(() => {
    const gross = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)
    const deliveredTotal = orders
      .filter((o) => o.status === 'Delivered')
      .reduce((s, o) => s + (Number(o.total) || 0), 0)
    const pending = orders.filter((o) => o.status === 'Processing' || o.status === 'In Transit').length
    const lowStock = products.filter((p) => Number(p.stock) <= 3).length
    const published = products.filter((p) => p.published !== false).length
    const averageOrderValue = orders.length > 0 ? gross / orders.length : 0
    const deliveredCount = orders.filter((o) => o.status === 'Delivered').length
    const deliveredRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0
    return {
      gross,
      deliveredTotal,
      pending,
      lowStock,
      published,
      totalProducts: products.length,
      averageOrderValue,
      deliveredRate,
    }
  }, [products, orders])

  const recent = useMemo(() => [...orders].slice(0, 5), [orders])

  const orderStatusBreakdown = useMemo(() => {
    const counts = { Processing: 0, 'In Transit': 0, Delivered: 0, Cancelled: 0 }
    for (const o of orders) {
      const key = String(o.status || '').trim()
      if (key in counts) counts[key] += 1
    }
    return counts
  }, [orders])

  const topCategories = useMemo(() => {
    const map = new Map()
    for (const p of products) {
      const cat = String(p.category || '').trim() || 'Uncategorized'
      map.set(cat, (map.get(cat) || 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [products])

  if (loading) {
    return <p className="font-playfair text-muted">Loading dashboard…</p>
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
        ) : (
          <p className="font-playfair text-sm text-muted">
            Gross value counts every order; delivered sales counts completed orders only. Refreshes when
            catalogue or orders change (local mode).
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {error ? (
            <button
              type="button"
              onClick={() => loadAll()}
            className="lux-button px-5 py-2 text-sm"
            >
              Retry
            </button>
          ) : null}
          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadAll()}
            className="button-tertiary bg-white px-4 py-2 text-ink disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <div className="lux-card p-5">
          <p className="text-overline text-xs">Gross order value</p>
          <p className="mt-2 font-bodoni text-3xl text-gold">₹{stats.gross.toLocaleString()}</p>
          <p className="mt-1 font-playfair text-sm text-muted">All statuses · {orders.length} orders</p>
        </div>
        <div className="lux-card p-5">
          <p className="text-overline text-xs">Delivered sales</p>
          <p className="mt-2 font-bodoni text-3xl text-ink">₹{stats.deliveredTotal.toLocaleString()}</p>
          <p className="mt-1 font-playfair text-sm text-muted">Delivered orders only</p>
        </div>
        <div className="lux-card p-5">
          <p className="text-overline text-xs">Pending fulfilment</p>
          <p className="mt-2 font-bodoni text-3xl text-ink">{stats.pending}</p>
          <p className="mt-1 font-playfair text-sm text-muted">Processing + in transit</p>
        </div>
        <div className="lux-card p-5">
          <p className="text-overline text-xs">Low stock (≤3)</p>
          <p className="mt-2 font-bodoni text-3xl text-[#7a2c3a]">{stats.lowStock}</p>
          <p className="mt-1 font-playfair text-sm text-muted">SKUs to restock</p>
        </div>
        <div className="lux-card p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-overline text-xs">Catalogue</p>
          <p className="mt-2 font-bodoni text-3xl text-ink">{stats.published}</p>
          <p className="mt-1 font-playfair text-sm text-muted">Live of {stats.totalProducts} total</p>
        </div>
        <div className="lux-card p-5 sm:col-span-1 xl:col-span-1">
          <p className="text-overline text-xs">Avg order value</p>
          <p className="mt-2 font-bodoni text-3xl text-ink">₹{Math.round(stats.averageOrderValue).toLocaleString()}</p>
          <p className="mt-1 font-playfair text-sm text-muted">Across all orders</p>
        </div>
        <div className="lux-card p-5 sm:col-span-1 xl:col-span-1">
          <p className="text-overline text-xs">Delivered rate</p>
          <p className="mt-2 font-bodoni text-3xl text-ink">{stats.deliveredRate}%</p>
          <p className="mt-1 font-playfair text-sm text-muted">Delivered vs total orders</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lux-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="card-heading">Order status mix</h2>
            <Link to="/admin/orders" className="font-playfair text-sm text-[#7a2c3a] hover:underline">
              Manage orders
            </Link>
          </div>
          <ul className="space-y-3">
            {Object.entries(orderStatusBreakdown).map(([status, count]) => {
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
              return (
                <li key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-playfair text-ink">{status}</span>
                    <span className="font-playfair text-muted">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f1e5d4]">
                    <div className="h-2 rounded-full bg-[#7a2c3a]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="lux-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="card-heading">Top categories</h2>
            <Link to="/admin/categories" className="font-playfair text-sm text-[#7a2c3a] hover:underline">
              Manage categories
            </Link>
          </div>
          {topCategories.length === 0 ? (
            <p className="font-playfair text-sm text-muted">No product data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topCategories.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between">
                  <span className="font-playfair text-ink">{name}</span>
                  <span className="rounded-full bg-[#f6ecdf] px-3 py-1 text-xs text-muted">
                    {count} item{count === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/admin/products/new" className="lux-button px-4 py-2 text-sm">
              Add product
            </Link>
            <Link to="/admin/merchandising" className="lux-button-outline px-4 py-2 text-sm">
              Update new arrivals
            </Link>
          </div>
        </div>
      </div>

      <div className="lux-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfc9] px-5 py-4">
          <h2 className="card-heading">Recent orders</h2>
          <Link
            to="/admin/orders"
            className="font-playfair text-sm text-[#7a2c3a] hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left font-playfair text-sm">
            <thead className="bg-[#f8f1e6]/80 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-[#eadfc9]">
                  <td className="px-5 py-3">
                    <Link
                      to={`/admin/orders/${encodeURIComponent(o.id)}`}
                      className="text-[#7a2c3a] hover:underline"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{o.date}</td>
                  <td className="px-5 py-3">{o.status}</td>
                  <td className="px-5 py-3 text-right">₹{Number(o.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center font-playfair text-muted">No orders yet.</p>
        ) : null}
      </div>
    </div>
  )
}
