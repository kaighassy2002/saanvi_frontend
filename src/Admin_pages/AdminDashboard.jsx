import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { listOrders, listProducts } from './services/adminApi'
import { adminFetchReviews } from '../services/reviewService'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminStatusBadge from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function KpiCard({ label, value, sub }) {
  return (
    <div className="lux-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-playfair text-2xl text-ink">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  )
}

function AdminDashboard() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [pendingReviews, setPendingReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [prods, ords, reviewData] = await Promise.all([
        listProducts(authFetch),
        listOrders(authFetch),
        adminFetchReviews().catch(() => ({ reviews: [] })),
      ])
      setProducts(prods)
      setOrders(ords)
      const reviews = Array.isArray(reviewData?.reviews) ? reviewData.reviews : []
      setPendingReviews(reviews.filter((r) => r.status === 'pending').length)
    } catch (e) {
      setError(e?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const orderStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    return { count: orders.length, totalRevenue }
  }, [orders])

  const recentOrders = useMemo(() => orders.slice(0, 10), [orders])

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your store activity."
      />

      <AdminErrorBanner message={error} onRetry={load} />

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Products" value={products.length} />
            <KpiCard label="Orders" value={orderStats.count} />
            <KpiCard
              label="Revenue (all orders)"
              value={formatPrice(orderStats.totalRevenue)}
            />
            <KpiCard
              label="Pending reviews"
              value={pendingReviews}
              sub={pendingReviews > 0 ? 'Needs moderation' : 'All clear'}
            />
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link to="/admin/products/new" className="lux-button px-4 py-2 text-sm">
              Add product
            </Link>
            <Link
              to="/admin/orders"
              className="rounded-lg border border-[#d8c4a7] px-4 py-2 text-sm hover:bg-[#f7ecee]"
            >
              View orders
            </Link>
            <Link
              to="/admin/reviews"
              className="rounded-lg border border-[#d8c4a7] px-4 py-2 text-sm hover:bg-[#f7ecee]"
            >
              Moderate reviews
              {pendingReviews > 0 ? ` (${pendingReviews})` : ''}
            </Link>
            <Link
              to="/admin/merchandising"
              className="rounded-lg border border-[#d8c4a7] px-4 py-2 text-sm hover:bg-[#f7ecee]"
            >
              Merchandising
            </Link>
          </div>

          <h2 className="font-playfair text-lg text-ink mb-3">Recent orders</h2>
          <AdminDataTable
            columns={columns}
            loading={false}
            emptyMessage="No orders yet."
          >
            {recentOrders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-[#f0e6d6] last:border-0 cursor-pointer hover:bg-[#faf7f2]"
                onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}
              >
                <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                <td className="px-4 py-3">
                  <p className="text-ink">{o.customerName || '—'}</p>
                  <p className="text-xs text-muted">{o.customerEmail || ''}</p>
                </td>
                <td className="px-4 py-3">{formatPrice(o.total)}</td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </AdminDataTable>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
