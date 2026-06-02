import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getDashboardSummary } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminDataTable from './components/AdminDataTable'
import AdminStatusBadge from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function formatCompact(n) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(n || 0)
  )
}

function MetricStrip({ items }) {
  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-[#e8d5c0] bg-white">
      <div className="grid gap-px bg-[#efe2d1] md:grid-cols-5">
        {items.map((item) => {
          const block = (
            <div className="bg-white px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted">{item.label}</p>
              <p className="mt-1 font-playfair text-xl text-ink">{item.value}</p>
              <p className="mt-0.5 text-xs text-muted">{item.sub}</p>
            </div>
          )
          return item.to ? <Link key={item.label} to={item.to}>{block}</Link> : <div key={item.label}>{block}</div>
        })}
      </div>
    </section>
  )
}

function SectionCard({ title, action, className = '', children }) {
  return (
    <section className={`rounded-xl border border-[#e8d5c0] bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-playfair text-base text-ink">{title}</h2>
        {action || null}
      </div>
      {children}
    </section>
  )
}

function SignalBar({ label, value, max, to }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const width = Math.max(6, pct)
  return (
    <Link to={to} className="block rounded-lg border border-[#efe2d1] bg-[#fffdfa] p-3 hover:bg-[#fcf7f1]">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#efe2d1]">
        <div className="h-1.5 rounded-full bg-[#7a2c3a]" style={{ width: `${width}%` }} />
      </div>
    </Link>
  )
}

function AdminDashboard() {
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const { refreshBadges } = useOutletContext() || {}
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await getDashboardSummary(authFetch)
      setSummary(data)
      refreshBadges?.()
    } catch (e) {
      setError(e?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [authFetch, refreshBadges])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
  ]

  const statusCounts = summary?.statusCounts || {}
  const lanes = ['Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled']
  const recentOrders = Array.isArray(summary?.recentOrders) ? summary.recentOrders : []
  const maxLane = Math.max(1, ...lanes.map((name) => Number(statusCounts[name]) || 0))
  const riskScore = Number(summary?.pendingReviews || 0) + Number(summary?.lowStockCount || 0)

  const commandItems = useMemo(
    () => [
      {
        label: 'Orders (7d)',
        value: summary?.orders7d ?? 0,
        sub: 'Throughput this week',
      },
      {
        label: 'Revenue (7d)',
        value: formatPrice(summary?.revenue7d),
        sub: `~${formatCompact(summary?.revenue7d)} this week`,
      },
      {
        label: 'Avg order value',
        value: formatPrice(summary?.aov7d),
        sub: `${summary?.orderCount ?? 0} lifetime orders`,
      },
      {
        label: 'Pending reviews',
        value: summary?.pendingReviews ?? 0,
        sub: summary?.pendingReviews ? 'Action recommended' : 'No moderation backlog',
        to: '/admin/reviews?status=pending',
      },
      {
        label: 'Low stock',
        value: summary?.lowStockCount ?? 0,
        sub: summary?.lowStockCount ? 'Replenishment needed' : 'Inventory healthy',
        to: '/admin/inventory',
      },
    ],
    [summary]
  )

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="A command-center view for trade, fulfilment, and attention hotspots."
      />

      <AdminErrorBanner message={error} onRetry={load} />

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : summary ? (
        <>
          <MetricStrip items={commandItems} />

          <div className="mb-5 grid gap-4 xl:grid-cols-12">
            <SectionCard
              className="xl:col-span-7"
              title="Flow lanes"
              action={
                <Link to="/admin/orders" className="text-xs text-[#7a2c3a] hover:underline">
                  Open orders
                </Link>
              }
            >
              <div className="space-y-2.5">
                {lanes.map((lane) => (
                  <SignalBar
                    key={lane}
                    label={lane}
                    value={Number(statusCounts[lane]) || 0}
                    max={maxLane}
                    to={`/admin/orders?status=${encodeURIComponent(lane)}`}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard className="xl:col-span-5" title="Operations radar">
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  to="/admin/reviews?status=pending"
                  className="rounded-lg border border-amber-200 bg-amber-50/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wide text-muted">Moderation queue</p>
                  <p className="mt-1 font-playfair text-2xl text-ink">{summary.pendingReviews ?? 0}</p>
                  <p className="text-xs text-muted">Pending reviews</p>
                </Link>
                <Link
                  to="/admin/inventory"
                  className="rounded-lg border border-red-200 bg-red-50/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wide text-muted">Stock risk</p>
                  <p className="mt-1 font-playfair text-2xl text-ink">{summary.lowStockCount ?? 0}</p>
                  <p className="text-xs text-muted">Items at threshold</p>
                </Link>
              </div>
              <div className="mt-3 rounded-lg border border-[#efe2d1] bg-[#fffdfa] p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Attention index</p>
                <p className="mt-1 font-playfair text-2xl text-ink">{riskScore}</p>
                <p className="text-xs text-muted">
                  Sum of unresolved inventory + moderation signals.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/admin/products/new"
                  className="lux-button rounded-lg px-3 py-2 text-center text-sm"
                >
                  Add product
                </Link>
                <Link
                  to="/admin/analytics"
                  className="rounded-lg border border-[#d8c4a7] px-3 py-2 text-center text-sm hover:bg-[#f7ecee]"
                >
                  Analytics
                </Link>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-12">
            <SectionCard
              className="xl:col-span-8"
              title="Recent orders ledger"
              action={
                <Link to="/admin/orders" className="text-xs text-[#7a2c3a] hover:underline">
                  View all
                </Link>
              }
            >
              <AdminDataTable columns={columns} loading={false} emptyMessage="No orders yet.">
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
            </SectionCard>

            <SectionCard className="xl:col-span-4" title="Command shelf">
              <div className="space-y-2">
                <Link
                  to="/admin/products?stock=low"
                  className="block rounded-lg border border-[#d8c4a7] px-4 py-2 text-center text-sm hover:bg-[#f7ecee]"
                >
                  Low-stock products
                </Link>
                <Link
                  to="/admin/reviews?status=pending"
                  className="block rounded-lg border border-[#d8c4a7] px-4 py-2 text-center text-sm hover:bg-[#f7ecee]"
                >
                  Pending reviews
                </Link>
                <Link
                  to="/admin/customers"
                  className="block rounded-lg border border-[#d8c4a7] px-4 py-2 text-center text-sm hover:bg-[#f7ecee]"
                >
                  Customer desk
                </Link>
                <Link
                  to="/admin/settings"
                  className="block rounded-lg border border-[#d8c4a7] px-4 py-2 text-center text-sm hover:bg-[#f7ecee]"
                >
                  Store settings
                </Link>
              </div>
              <div className="mt-4 rounded-lg border border-[#efe2d1] bg-[#fffdfa] p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Sales synopsis</p>
                <p className="mt-1 text-sm text-ink">
                  7-day revenue is <strong>{formatPrice(summary.revenue7d)}</strong> with average basket{' '}
                  <strong>{formatPrice(summary.aov7d)}</strong>.
                </p>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default AdminDashboard
