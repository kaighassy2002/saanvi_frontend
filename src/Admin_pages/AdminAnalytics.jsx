import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getProductAnalytics, getSalesAnalytics } from './services/adminApi'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminPageHeader from './components/AdminPageHeader'
import { AdminKpiIcon } from './components/AdminKpiIcons'
import {
  CategoryBreakdownChart,
  MiniSparkline,
  OrdersVolumeChart,
  RevenueLineChart,
} from './components/AdminDashboardCharts'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

const KPI_ACCENTS = {
  revenue: '#c9a34a',
  orders: '#9f7a2c',
  pending: '#7a2c3a',
  products: '#5a6b52',
}

const INSIGHT_ICONS = {
  peak: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 20h18M7 16l4-8 4 5 5-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  avgRevenue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  avgOrders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6h15l-1.5 9H7.5L6 6zM6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  ),
}

function getDateRange(days, offsetDays = 0) {
  const to = new Date()
  to.setDate(to.getDate() - offsetDays)
  const from = new Date(to)
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function pctChange(current, previous) {
  const cur = Number(current) || 0
  const prev = Number(previous) || 0
  if (prev === 0) return cur > 0 ? 100 : null
  return Math.round(((cur - prev) / prev) * 1000) / 10
}

function formatPeriodLabel(days) {
  if (days === 7) return 'prior week'
  if (days === 30) return 'prior month'
  return 'prior period'
}

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

function AnalyticsKpi({ icon, label, value, trend, periodLabel, sparkValues, accent }) {
  return (
    <div className="admin-analytics-kpi">
      <div className="admin-analytics-kpi__accent" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      <div className="admin-analytics-kpi__head">
        <div className="min-w-0">
          <p className="admin-analytics-kpi__label">{label}</p>
          <p className="admin-analytics-kpi__value">{value}</p>
          {trend != null ? <KpiTrend value={trend} periodLabel={periodLabel} /> : null}
        </div>
        <span className={`admin-kpi-tile__icon admin-kpi-tile__icon--${icon} admin-analytics-kpi__icon`}>
          <AdminKpiIcon name={icon} />
        </span>
      </div>
      <MiniSparkline values={sparkValues} color={accent} />
    </div>
  )
}

function PanelCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`admin-panel ${className}`}>
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">{title}</h2>
          {subtitle ? <p className="admin-section-subtitle">{subtitle}</p> : null}
        </div>
        {action || null}
      </div>
      {children}
    </section>
  )
}

function PeriodPills({ value, onChange }) {
  return (
    <div className="admin-analytics-period" role="group" aria-label="Select period">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`admin-analytics-period__btn ${value === opt.value ? 'admin-analytics-period__btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function InsightCard({ icon, label, value }) {
  return (
    <div className="admin-analytics-insight">
      <span className="admin-analytics-insight__icon">{icon}</span>
      <div className="min-w-0">
        <p className="admin-analytics-insight__label">{label}</p>
        <p className="admin-analytics-insight__value">{value}</p>
      </div>
    </div>
  )
}

function PeriodComparePanel({ sales, prevSales, periodLabel, formatPrice: fmt }) {
  const rows = [
    { label: 'Revenue', current: fmt(sales?.totalRevenue), previous: fmt(prevSales?.totalRevenue) },
    { label: 'Orders', current: sales?.totalOrders ?? 0, previous: prevSales?.totalOrders ?? 0 },
    { label: 'Avg. order value', current: fmt(sales?.aov), previous: fmt(prevSales?.aov) },
  ]

  return (
    <div className="admin-analytics-compare h-full">
      <p className="admin-analytics-compare__title">Period comparison</p>
      <p className="mb-3 text-xs text-muted">Current vs {periodLabel}</p>
      {rows.map((row) => (
        <div key={row.label} className="admin-analytics-compare__row">
          <div>
            <p className="admin-analytics-compare__metric">{row.label}</p>
            <p className="admin-analytics-compare__current">{row.current}</p>
          </div>
          <p className="admin-analytics-compare__prev">{row.previous}</p>
        </div>
      ))}
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[108px] rounded-xl bg-[#f4e8db]" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] rounded-xl bg-[#f4e8db]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-80 rounded-xl bg-[#f4e8db] lg:col-span-8" />
        <div className="h-80 rounded-xl bg-[#f4e8db] lg:col-span-4" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-xl bg-[#f4e8db]" />
        <div className="h-72 rounded-xl bg-[#f4e8db]" />
      </div>
    </div>
  )
}

function AdminAnalytics() {
  const { authFetch } = useAdminAuth()
  const [sales, setSales] = useState(null)
  const [prevSales, setPrevSales] = useState(null)
  const [products, setProducts] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    async (silent = false) => {
      setError('')
      if (silent) setRefreshing(true)
      else setLoading(true)
      try {
        const current = getDateRange(days)
        const previous = getDateRange(days, days)
        const [currentSales, previousSales, productStats] = await Promise.all([
          getSalesAnalytics(authFetch, current),
          getSalesAnalytics(authFetch, previous),
          getProductAnalytics(authFetch),
        ])
        setSales(currentSales)
        setPrevSales(previousSales)
        setProducts(productStats)
      } catch (e) {
        setError(e?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [authFetch, days]
  )

  useEffect(() => {
    load()
  }, [load])

  const periodLabel = formatPeriodLabel(days)
  const revenueSeries = Array.isArray(sales?.series) ? sales.series : []

  const insights = useMemo(() => {
    if (!revenueSeries.length) return null
    const bestDay = revenueSeries.reduce(
      (best, row) => ((Number(row.revenue) || 0) > (Number(best.revenue) || 0) ? row : best),
      revenueSeries[0]
    )
    const totalOrders = Number(sales?.totalOrders) || 0
    const totalRevenue = Number(sales?.totalRevenue) || 0
    const dayCount = Math.max(revenueSeries.length, 1)
    return {
      bestDay,
      avgDailyRevenue: totalRevenue / dayCount,
      avgDailyOrders: totalOrders / dayCount,
    }
  }, [sales, revenueSeries])

  const trends = useMemo(
    () => ({
      revenue: pctChange(sales?.totalRevenue, prevSales?.totalRevenue),
      orders: pctChange(sales?.totalOrders, prevSales?.totalOrders),
      aov: pctChange(sales?.aov, prevSales?.aov),
    }),
    [sales, prevSales]
  )

  const sparklines = useMemo(
    () => ({
      revenue: revenueSeries.map((d) => d.revenue),
      orders: revenueSeries.map((d) => d.orders),
      aov: revenueSeries.map((d) => {
        const o = Number(d.orders) || 0
        return o > 0 ? (Number(d.revenue) || 0) / o : 0
      }),
    }),
    [revenueSeries]
  )

  const topByStock = Array.isArray(products?.topByStock) ? products.topByStock : []
  const byCategory = Array.isArray(products?.byCategory) ? products.byCategory : []
  const maxStock = Math.max(...topByStock.map((p) => Number(p.stock) || 0), 1)

  return (
    <div className="admin-dashboard admin-analytics">
      <AdminPageHeader title="Analytics" description="Deep dive into sales performance and catalog health">
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="admin-view-all disabled:opacity-50"
          aria-label="Refresh analytics"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        <PeriodPills value={days} onChange={setDays} />
      </AdminPageHeader>

      <AdminErrorBanner message={error} onRetry={() => load()} />

      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <p className="admin-analytics-section">Key metrics</p>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsKpi
              icon="revenue"
              label="Revenue"
              value={formatPrice(sales?.totalRevenue)}
              trend={trends.revenue}
              periodLabel={periodLabel}
              sparkValues={sparklines.revenue}
              accent={KPI_ACCENTS.revenue}
            />
            <AnalyticsKpi
              icon="orders"
              label="Orders"
              value={sales?.totalOrders ?? 0}
              trend={trends.orders}
              periodLabel={periodLabel}
              sparkValues={sparklines.orders}
              accent={KPI_ACCENTS.orders}
            />
            <AnalyticsKpi
              icon="pending"
              label="Avg. order value"
              value={formatPrice(sales?.aov)}
              trend={trends.aov}
              periodLabel={periodLabel}
              sparkValues={sparklines.aov}
              accent={KPI_ACCENTS.pending}
            />
            <AnalyticsKpi
              icon="products"
              label="Published products"
              value={products?.publishedCount ?? 0}
              sparkValues={byCategory.map((c) => c.count)}
              accent={KPI_ACCENTS.products}
            />
          </div>

          {insights ? (
            <>
              <p className="admin-analytics-section">Daily insights</p>
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <InsightCard
                  icon={INSIGHT_ICONS.peak}
                  label="Peak revenue day"
                  value={`${formatPrice(insights.bestDay.revenue)} · ${new Date(insights.bestDay.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}`}
                />
                <InsightCard
                  icon={INSIGHT_ICONS.avgRevenue}
                  label="Avg. daily revenue"
                  value={formatPrice(insights.avgDailyRevenue)}
                />
                <InsightCard
                  icon={INSIGHT_ICONS.avgOrders}
                  label="Avg. daily orders"
                  value={insights.avgDailyOrders.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                />
              </div>
            </>
          ) : null}

          <p className="admin-analytics-section">Sales performance</p>
          <div className="mb-5 grid gap-4 lg:grid-cols-12">
            <PanelCard
              className="lg:col-span-8"
              title="Revenue trend"
              subtitle="Daily gross revenue"
            >
              <RevenueLineChart series={revenueSeries} formatPrice={formatPrice} />
            </PanelCard>

            <div className="lg:col-span-4">
              <PeriodComparePanel
                sales={sales}
                prevSales={prevSales}
                periodLabel={periodLabel}
                formatPrice={formatPrice}
              />
            </div>
          </div>

          <p className="admin-analytics-section">Catalog & orders</p>
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <PanelCard title="Order volume" subtitle="Orders placed per day">
              <OrdersVolumeChart series={revenueSeries} />
            </PanelCard>

            <PanelCard
              title="Catalog by category"
              subtitle={`${products?.publishedCount ?? 0} published products`}
              action={
                <Link to="/admin/categories" className="admin-view-all">
                  Manage
                </Link>
              }
            >
              <CategoryBreakdownChart items={byCategory} showDonut />
            </PanelCard>
          </div>

          <PanelCard
            title="Highest stock products"
            subtitle="Top inventory levels across your catalog"
            action={
              <Link to="/admin/inventory" className="admin-view-all">
                View inventory
              </Link>
            }
          >
            {topByStock.length ? (
              <div className="divide-y divide-[#f0e6d6]">
                {topByStock.map((p, i) => {
                  const stock = Number(p.stock) || 0
                  const stockPct = Math.round((stock / maxStock) * 100)
                  return (
                    <Link
                      key={p.id}
                      to={`/admin/products/${encodeURIComponent(p.id)}/edit`}
                      className="block rounded-lg px-1 py-3.5 transition hover:bg-[#faf7f2]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`admin-analytics-rank ${i < 3 ? 'admin-analytics-rank--top' : ''}`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                              <p className="text-xs text-muted">{p.category || 'Uncategorized'}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold tabular-nums text-ink">{stock} units</p>
                              <p className="text-xs text-muted">{formatPrice(p.price)}</p>
                            </div>
                          </div>
                          <div className="admin-analytics-stock-bar">
                            <div className="admin-analytics-stock-bar__fill" style={{ width: `${stockPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted">No published products yet.</p>
            )}
          </PanelCard>
        </>
      )}
    </div>
  )
}

export default AdminAnalytics
