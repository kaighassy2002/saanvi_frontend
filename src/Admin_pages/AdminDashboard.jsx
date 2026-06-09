import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getDashboardSummary } from './services/adminApi'
import AdminDataTable from './components/AdminDataTable'
import AdminStatusBadge from './components/AdminStatusBadge'
import AdminErrorBanner from './components/AdminErrorBanner'
import { RevenueLineChart, OrderStatusDonut } from './components/AdminDashboardCharts'
import { AdminKpiIcon } from './components/AdminKpiIcons'
import AdminDashboardActionQueue from './components/AdminDashboardActionQueue'
import AdminDashboardPaymentSplit from './components/AdminDashboardPaymentSplit'
import AdminDashboardCampaignPanel from './components/AdminDashboardCampaignPanel'
import AdminPageHeader from './components/AdminPageHeader'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function formatOrderDateTime(raw) {
  if (!raw) return { date: '—', time: '' }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return { date: String(raw), time: '' }
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }
}

function PaymentBadge({ status }) {
  const key = String(status || 'pending').toLowerCase()
  const styles = {
    paid: 'bg-[#f0f4ee] text-[#5a6b52]',
    pending: 'bg-[#fff6eb] text-[#9f7a2c]',
    failed: 'bg-[#f7ecee] text-[#7a2c3a]',
    refunded: 'bg-[#f8f1e6] text-[#6f5d5b]',
  }
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize ${styles[key] || styles.pending}`}>
      {status || 'pending'}
    </span>
  )
}

const ORDER_LANES = [
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

const KPI_CONFIG = [
  {
    key: 'revenue',
    icon: 'revenue',
    label: 'Net Revenue',
    getValue: (s) => formatPrice(s.revenue?.net ?? s.revenue7d ?? 0),
    getSublabel: (s) => `Gross ${formatPrice(s.revenue?.gross ?? 0)}`,
    to: '/admin/analytics',
    trendKey: 'netRevenue',
  },
  { key: 'orders', icon: 'orders', label: 'Orders', field: 'orders7d', format: (v) => v, to: '/admin/orders', trendKey: 'orders' },
  { key: 'customers', icon: 'customers', label: 'Total Customers', field: 'customerCount', format: (v) => v, to: '/admin/customers', trendKey: 'customers' },
  { key: 'products', icon: 'products', label: 'Total Products', field: 'publishedCount', format: (v) => v, to: '/admin/products', trendKey: null },
  { key: 'pending', icon: 'pending', label: 'Active Orders', field: 'processingOrders', format: (v) => v, to: '/admin/orders?status=Placed', trendKey: 'processing' },
]

const PERIOD_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'This month' },
  { value: 90, label: 'Last 90 days' },
]

function KpiTrend({ value, periodLabel }) {
  if (value == null || Number.isNaN(value)) return null
  const up = value >= 0
  return (
    <p className={`admin-kpi-tile__trend ${up ? 'admin-kpi-tile__trend--up' : 'admin-kpi-tile__trend--down'}`}>
      {up ? '+' : ''}
      {value}% <span className="text-muted font-normal">vs {periodLabel}</span>
    </p>
  )
}

function KpiTile({ icon, label, value, sublabel, trend, periodLabel, to }) {
  const inner = (
    <div className="admin-kpi-tile">
      <span className={`admin-kpi-tile__icon admin-kpi-tile__icon--${icon}`}>
        <AdminKpiIcon name={icon} />
      </span>
      <div className="admin-kpi-tile__body">
        <p className="admin-kpi-tile__label">{label}</p>
        <p className="admin-kpi-tile__value">{value}</p>
        {sublabel ? <p className="admin-kpi-tile__sublabel">{sublabel}</p> : null}
        {trend != null ? <KpiTrend value={trend} periodLabel={periodLabel} /> : null}
      </div>
    </div>
  )
  return to ? (
    <Link to={to} className="admin-kpi-tile-wrap">
      {inner}
    </Link>
  ) : (
    <div className="admin-kpi-tile-wrap">{inner}</div>
  )
}

function KpiRow({ items, periodLabel }) {
  return (
    <div className="admin-kpi-row">
      {items.map((item) => (
        <KpiTile key={item.key} {...item} periodLabel={periodLabel} />
      ))}
    </div>
  )
}

function PanelCard({ title, action, children, className = '' }) {
  return (
    <section className={`admin-panel ${className}`}>
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">{title}</h2>
        {action || null}
      </div>
      {children}
    </section>
  )
}

function ViewAllButton({ to }) {
  return (
    <Link to={to} className="admin-view-all">
      View All
    </Link>
  )
}

function PeriodSelect({ value, onChange }) {
  return (
    <select className="admin-period-select" value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label="Period">
      {PERIOD_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-36 rounded-xl bg-[#f4e8db]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[88px] rounded-xl bg-[#f4e8db]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-72 rounded-xl bg-[#f4e8db] lg:col-span-8" />
        <div className="h-72 rounded-xl bg-[#f4e8db] lg:col-span-4" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-72 rounded-xl bg-[#f4e8db] lg:col-span-4" />
        <div className="h-72 rounded-xl bg-[#f4e8db] lg:col-span-8" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-96 rounded-xl bg-[#f4e8db] lg:col-span-8" />
        <div className="h-96 rounded-xl bg-[#f4e8db] lg:col-span-4" />
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { authFetch, profile } = useAdminAuth()
  const navigate = useNavigate()
  const { refreshBadges } = useOutletContext() || {}
  const [summary, setSummary] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await getDashboardSummary(authFetch, { days })
      setSummary(data)
      refreshBadges?.()
    } catch (e) {
      setError(e?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [authFetch, refreshBadges, days])

  useEffect(() => {
    load()
  }, [load])

  const periodLabel = days === 7 ? 'last week' : days === 30 ? 'last month' : 'prior period'
  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Admin'

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Amount' },
    { key: 'payment', label: 'Payment' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: '' },
  ]

  const recentOrders = Array.isArray(summary?.recentOrders) ? summary.recentOrders : []
  const topProducts = Array.isArray(summary?.topSellingProducts) ? summary.topSellingProducts : []
  const revenueSeries = Array.isArray(summary?.revenueSeries) ? summary.revenueSeries : []
  const orderOverview = summary?.orderOverview || summary?.statusCounts || {}
  const trends = summary?.trends || {}

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        title="Dashboard"
        description={
          <>
            Welcome back, <span className="font-medium text-ink">{displayName}</span>!
          </>
        }
      />

      <AdminErrorBanner message={error} onRetry={load} />

      {loading ? (
        <DashboardSkeleton />
      ) : summary ? (
        <>
          <AdminDashboardActionQueue actionQueue={summary.actionQueue} />

          <KpiRow
            periodLabel={periodLabel}
            items={KPI_CONFIG.map((kpi) => ({
              key: kpi.key,
              icon: kpi.icon,
              label: kpi.label,
              value: kpi.getValue ? kpi.getValue(summary) : kpi.format(summary[kpi.field] ?? 0),
              sublabel: kpi.getSublabel ? kpi.getSublabel(summary) : null,
              trend: kpi.trendKey ? trends[kpi.trendKey] : null,
              to: kpi.to,
            }))}
          />

          {summary.revenue?.refunds > 0 ? (
            <p className="mb-4 text-xs text-muted">
              Refunds in period: {formatPrice(summary.revenue.refunds)} across{' '}
              {summary.revenue.refundOrderCount || 0} order
              {(summary.revenue.refundOrderCount || 0) === 1 ? '' : 's'}
            </p>
          ) : null}

          <div className="mb-4 grid gap-4 lg:grid-cols-12">
            <PanelCard
              className="lg:col-span-8"
              title="Sales Overview"
              action={<PeriodSelect value={days} onChange={setDays} />}
            >
              <p className="px-4 pb-2 text-[11px] text-muted">Net revenue after refunds</p>
              <RevenueLineChart series={revenueSeries} formatPrice={formatPrice} />
            </PanelCard>

            <PanelCard className="lg:col-span-4" title="Payment Split">
              <div className="p-4 pt-0">
                <AdminDashboardPaymentSplit paymentSplit={summary.paymentSplit} formatPrice={formatPrice} />
              </div>
            </PanelCard>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-12">
            <PanelCard className="lg:col-span-4" title="Orders Overview">
              <OrderStatusDonut statusCounts={orderOverview} lanes={ORDER_LANES} />
            </PanelCard>

            <PanelCard
              className="lg:col-span-8"
              title="Festival & Campaign Spotlight"
              action={<ViewAllButton to="/admin/merchandising" />}
            >
              <AdminDashboardCampaignPanel campaignPerformance={summary.campaignPerformance} />
            </PanelCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <PanelCard
              className="lg:col-span-8"
              title="Recent Orders"
              action={<ViewAllButton to="/admin/orders" />}
            >
              <AdminDataTable columns={columns} loading={false} emptyMessage="No orders yet.">
                {recentOrders.map((o) => {
                  const dt = formatOrderDateTime(o.date || o.createdAt)
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-[#f0e6d6] last:border-0 hover:bg-[#faf7f2] transition-colors"
                    >
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}
                          className="font-sans text-xs font-medium text-[#c9a34a] hover:underline"
                        >
                          {o.id}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-ink">{o.customerName || '—'}</p>
                        <p className="text-xs text-muted truncate max-w-[150px]">{o.customerEmail || ''}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs text-ink whitespace-nowrap">{dt.date}</p>
                        {dt.time ? <p className="text-[11px] text-muted">{dt.time}</p> : null}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold tabular-nums text-ink">{formatPrice(o.total)}</td>
                      <td className="px-3 py-3">
                        <PaymentBadge status={o.paymentStatus} />
                      </td>
                      <td className="px-3 py-3">
                        <AdminStatusBadge status={o.status} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/orders/${encodeURIComponent(o.id)}`)}
                          className="admin-row-action"
                          aria-label="View order"
                        >
                          ⋯
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </AdminDataTable>
            </PanelCard>

            <PanelCard
              className="lg:col-span-4"
              title="Top Selling Products"
              action={<ViewAllButton to="/admin/products" />}
            >
              {topProducts.length ? (
                <div className="divide-y divide-[#f0e6d6]">
                  {topProducts.map((p) => (
                    <Link
                      key={p.productId}
                      to={`/admin/products/${encodeURIComponent(p.productId)}/edit`}
                      className="admin-product-row py-3"
                    >
                      <span className="admin-product-row__thumb">
                        {p.image ? (
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted">—</span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{p.qty} Sold</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-ink shrink-0">
                        {formatPrice(p.revenue)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted py-12 text-center">No sales in this period.</p>
              )}
            </PanelCard>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default AdminDashboard
