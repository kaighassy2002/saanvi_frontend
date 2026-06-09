import React, { useMemo, useState } from 'react'

const STATUS_COLORS = {
  Placed: '#e6c883',
  Confirmed: '#d4b87a',
  Packed: '#c9a34a',
  Shipped: '#9f7a2c',
  'Out For Delivery': '#b8956a',
  Delivered: '#5a6b52',
  Cancelled: '#7a2c3a',
  'Return Requested': '#c9a34a',
  Returned: '#8a7a6e',
  Processing: '#c9a34a',
  Pending: '#e6c883',
}

function formatShortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatCompactPrice(n) {
  const v = Number(n) || 0
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${Math.round(v / 1000)}k`
  return `₹${v}`
}

function smoothPath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function DonutChart({ segments, total, centerContent, formatValue }) {
  function arcPath(cx, cy, r, startDeg, sweepDeg) {
    const start = (startDeg * Math.PI) / 180
    const end = ((startDeg + sweepDeg) * Math.PI) / 180
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    const large = sweepDeg > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  if (!total) {
    return <p className="text-sm text-muted py-12 text-center">No data yet.</p>
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative mx-auto shrink-0 sm:mx-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="44" fill="none" stroke="#efe2d1" strokeWidth="11" />
          {segments.map((seg) => (
            <path
              key={seg.name}
              d={arcPath(60, 60, 44, seg.start, Math.max(seg.sweep - 0.4, 0))}
              fill="none"
              stroke={seg.color}
              strokeWidth="11"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          {centerContent || (
            <>
              <span className="font-sans text-lg font-semibold text-ink leading-tight">{total}</span>
              <span className="text-[10px] text-muted">Total</span>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-ink min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="truncate">{seg.name}</span>
            </span>
            <span className="text-muted tabular-nums shrink-0 text-right">
              {formatValue ? formatValue(seg) : seg.value}
              {seg.pct != null ? (
                <span className="block text-[10px] text-muted/80">({seg.pct}%)</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildDonutSegments(entries, colorMap) {
  const filtered = entries.filter((e) => e.value > 0)
  const sum = filtered.reduce((s, e) => s + e.value, 0) || 1
  let angle = -90
  return filtered.map((e) => {
    const sweep = (e.value / sum) * 360
    const start = angle
    angle += sweep
    return {
      ...e,
      start,
      sweep,
      color: colorMap[e.name] || '#d8c4a7',
      pct: Math.round((e.value / sum) * 1000) / 10,
    }
  })
}

export function RevenueLineChart({ series = [], formatPrice }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const width = 600
  const height = 220
  const padL = 48
  const padR = 16
  const padY = 20
  const chartW = width - padL - padR
  const chartH = height - padY * 2

  const points = useMemo(() => {
    if (!series.length) return []
    const max = Math.max(...series.map((s) => Number(s.revenue) || 0), 1)
    return series.map((s, i) => {
      const x = padL + (i / Math.max(series.length - 1, 1)) * chartW
      const y = padY + chartH - ((Number(s.revenue) || 0) / max) * chartH
      return { x, y, ...s, display: Number(s.revenue) || 0, max }
    })
  }, [series, chartH, chartW, padL, padY])

  const yTicks = useMemo(() => {
    if (!points.length) return []
    const max = points[0]?.max || 1
    return [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
      y: padY + chartH - pct * chartH,
      label: formatCompactPrice(max * pct),
    }))
  }, [points, chartH, padY])

  if (!series.length) {
    return <p className="text-sm text-muted py-16 text-center">No sales data for this period.</p>
  }

  const linePath = smoothPath(points)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`
  const active = hoverIdx != null ? points[hoverIdx] : null

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a34a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c9a34a" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick.label}>
            <line x1={padL} x2={width - padR} y1={tick.y} y2={tick.y} stroke="#efe2d1" strokeWidth="1" />
            <text x={padL - 8} y={tick.y + 4} textAnchor="end" className="fill-[#8a7573] text-[9px] font-sans">
              {tick.label}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#salesFill)" />
        <path d={linePath} fill="none" stroke="#c9a34a" strokeWidth="2.5" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.date}>
            <rect
              x={p.x - chartW / series.length / 2}
              y={padY}
              width={chartW / series.length}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 5 : 3.5}
              fill="#fffdf9"
              stroke="#c9a34a"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>

      {active ? (
        <div
          className="admin-chart-tooltip pointer-events-none"
          style={{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 100}%` }}
        >
          <p className="text-[10px] text-[#f8f1e6]/80">{formatShortDate(active.date)}</p>
          <p className="font-semibold">{formatPrice(active.revenue)}</p>
          {active.gross > active.revenue ? (
            <p className="text-[10px] text-[#f8f1e6]/70">Gross {formatPrice(active.gross)}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex justify-between gap-1 border-t border-[#f0e6d6] pt-2">
        {series.map((s) => (
          <span key={s.date} className="flex-1 text-center text-[10px] text-muted truncate font-sans">
            {formatShortDate(s.date)}
          </span>
        ))}
      </div>
    </div>
  )
}

export function OrderStatusDonut({ statusCounts = {}, lanes = [] }) {
  const { segments, total } = useMemo(() => {
    const entries = lanes.map((name) => ({ name, value: Number(statusCounts[name]) || 0 }))
    const segs = buildDonutSegments(entries, STATUS_COLORS)
    const sum = lanes.reduce((s, name) => s + (Number(statusCounts[name]) || 0), 0)
    return { segments: segs, total: sum }
  }, [statusCounts, lanes])

  return (
    <DonutChart
      segments={segments}
      total={total}
      formatValue={(seg) => seg.value}
      centerContent={
        <>
          <span className="font-sans text-lg font-semibold text-ink leading-tight">{total}</span>
          <span className="text-[10px] text-muted">Total</span>
        </>
      }
    />
  )
}

const PAYMENT_COLORS = {
  COD: '#9f7a2c',
  Prepaid: '#5a6b52',
}

const CATEGORY_COLORS = ['#c9a34a', '#9f7a2c', '#5a6b52', '#7a2c3a', '#b8956a', '#8a7a6e', '#d4b87a', '#6f5d5b']

export function OrdersVolumeChart({ series = [] }) {
  const [hoverIdx, setHoverIdx] = useState(null)

  const max = useMemo(
    () => Math.max(...series.map((s) => Number(s.orders) || 0), 1),
    [series]
  )

  if (!series.length) {
    return <p className="text-sm text-muted py-16 text-center">No orders for this period.</p>
  }

  const active = hoverIdx != null ? series[hoverIdx] : null
  const yTicks = [0, 0.5, 1].map((pct) => Math.round(max * pct))

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex flex-col justify-between py-1 text-[9px] tabular-nums text-muted">
          {yTicks
            .slice()
            .reverse()
            .map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-44 flex-col justify-between">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t border-dashed border-[#efe2d1]" />
            ))}
          </div>
          <div className="relative flex h-44 items-end gap-1 px-0.5">
            {series.map((point, i) => {
              const orders = Number(point.orders) || 0
              const heightPct = Math.max(orders > 0 ? 8 : 3, (orders / max) * 100)
              return (
                <div
                  key={point.date}
                  className="relative flex flex-1 flex-col items-center justify-end gap-1.5 min-w-0 h-full"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                      hoverIdx === i
                        ? 'bg-[#9f7a2c] shadow-[0_-4px_12px_-2px_rgba(159,122,44,0.45)]'
                        : 'bg-[linear-gradient(180deg,#d4b87a_0%,#c9a34a_100%)]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex gap-1 border-t border-[#f0e6d6] pt-2">
            {series.map((point) => (
              <span key={point.date} className="flex-1 truncate text-center text-[9px] text-muted font-sans">
                {formatShortDate(point.date)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {active ? (
        <div className="admin-chart-tooltip static mt-3 w-fit mx-auto translate-x-0 translate-y-0 pointer-events-auto">
          <p className="text-[10px] text-[#f8f1e6]/80">{formatShortDate(active.date)}</p>
          <p className="font-semibold tabular-nums">
            {Number(active.orders) || 0} order{(Number(active.orders) || 0) === 1 ? '' : 's'}
          </p>
          {active.revenue != null ? (
            <p className="text-[10px] text-[#f8f1e6]/70">{formatCompactPrice(active.revenue)} revenue</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-center text-[11px] text-muted">Hover a bar for daily details</p>
      )}
    </div>
  )
}

export function MiniSparkline({ values = [], color = '#c9a34a', height = 32 }) {
  const points = useMemo(() => {
    const nums = values.map((v) => Number(v) || 0)
    if (!nums.length) return []
    const max = Math.max(...nums, 1)
    const width = 88
    return nums.map((v, i) => ({
      x: (i / Math.max(nums.length - 1, 1)) * width,
      y: height - (v / max) * (height - 4) - 2,
    }))
  }, [values, height])

  if (points.length < 2) return <div className="h-8" aria-hidden />

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <svg width="88" height={height} className="mt-2 block" aria-hidden>
      <path d={area} fill={color} fillOpacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CategoryBreakdownChart({ items = [], showDonut = false }) {
  const total = items.reduce((s, row) => s + (Number(row.count) || 0), 0) || 1
  const segments = useMemo(() => {
    if (!items.length) return []
    const colorMap = Object.fromEntries(
      items.map((row, i) => [row.category, CATEGORY_COLORS[i % CATEGORY_COLORS.length]])
    )
    const entries = items.map((row) => ({ name: row.category, value: Number(row.count) || 0 }))
    return buildDonutSegments(entries, colorMap)
  }, [items])

  if (!items.length) {
    return <p className="text-sm text-muted py-8 text-center">No published products.</p>
  }

  const list = (
    <ul className="space-y-3">
      {items.map((row, i) => {
        const count = Number(row.count) || 0
        const pct = Math.round((count / total) * 1000) / 10
        const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
        return (
          <li key={row.category}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate font-medium text-ink">{row.category}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {count} <span className="text-[10px]">({pct}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f4e8db]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )

  if (!showDonut) return list

  return (
    <div className="space-y-5">
      <DonutChart
        segments={segments}
        total={total}
        formatValue={(seg) => seg.value}
        centerContent={
          <>
            <span className="font-sans text-lg font-semibold text-ink leading-tight">{total}</span>
            <span className="text-[10px] text-muted">Products</span>
          </>
        }
      />
      {list}
    </div>
  )
}

export function PaymentSplitChart({ cod = {}, prepaid = {}, formatPrice }) {
  const { segments, total } = useMemo(() => {
    const entries = [
      { name: 'COD', value: Number(cod.revenue) || 0 },
      { name: 'Prepaid', value: Number(prepaid.revenue) || 0 },
    ]
    const segs = buildDonutSegments(entries, PAYMENT_COLORS)
    const sum = (Number(cod.orders) || 0) + (Number(prepaid.orders) || 0)
    return { segments: segs, total: sum }
  }, [cod, prepaid])

  return (
    <DonutChart
      segments={segments}
      total={total}
      formatValue={(seg) => formatPrice(seg.value)}
      centerContent={
        <>
          <span className="font-sans text-lg font-semibold text-ink leading-tight">{total}</span>
          <span className="text-[10px] text-muted">Orders</span>
        </>
      }
    />
  )
}
