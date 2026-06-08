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
