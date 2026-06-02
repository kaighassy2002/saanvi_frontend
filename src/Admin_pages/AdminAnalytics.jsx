import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getProductAnalytics, getSalesAnalytics } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function BarChart({ series, maxValue }) {
  if (!series?.length) return <p className="text-sm text-muted">No data for this period.</p>
  const max = maxValue || Math.max(...series.map((x) => x.revenue), 1)
  return (
    <div className="flex items-end gap-1 h-40">
      {series.map((point) => (
        <div key={point.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full bg-[#7a2c3a]/80 rounded-t"
            style={{ height: `${Math.max(4, (point.revenue / max) * 100)}%` }}
            title={`${point.date}: ${formatPrice(point.revenue)}`}
          />
          <span className="text-[9px] text-muted truncate w-full text-center">
            {point.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

function AdminAnalytics() {
  const { authFetch } = useAdminAuth()
  const [sales, setSales] = useState(null)
  const [products, setProducts] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - days)
      const [s, p] = await Promise.all([
        getSalesAnalytics(authFetch, {
          from: from.toISOString().slice(0, 10),
          to: to.toISOString().slice(0, 10),
        }),
        getProductAnalytics(authFetch),
      ])
      setSales(s)
      setProducts(p)
    } catch (e) {
      setError(e?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [authFetch, days])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <AdminPageHeader title="Analytics" description="Sales trends and catalog breakdown." />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-4">
        <select
          className="rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="lux-card p-5">
            <h2 className="font-playfair text-sm text-ink mb-4">Revenue</h2>
            {sales ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <p className="text-xs text-muted">Revenue</p>
                    <p className="font-playfair text-lg">{formatPrice(sales.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Orders</p>
                    <p className="font-playfair text-lg">{sales.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">AOV</p>
                    <p className="font-playfair text-lg">{formatPrice(sales.aov)}</p>
                  </div>
                </div>
                <BarChart series={sales.series} />
              </>
            ) : null}
          </section>

          <section className="lux-card p-5">
            <h2 className="font-playfair text-sm text-ink mb-4">Catalog by category</h2>
            {products?.byCategory?.length ? (
              <ul className="space-y-2">
                {products.byCategory.map((row) => (
                  <li key={row.category} className="flex justify-between text-sm">
                    <span>{row.category}</span>
                    <span className="text-muted">{row.count} products</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No published products.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminAnalytics
