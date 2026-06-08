import React from 'react'

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    if (row?.label != null || row?.value != null) {
      return { label: String(row.label || ''), value: String(row.value || '') }
    }
    const keys = Object.keys(row || {})
    if (keys.length === 0) return null
    const label = keys[0]
    return { label, value: String(row[label] ?? '') }
  }).filter((r) => r && (r.label || r.value))
}

export default function SizeChartModal({ chart, open, onClose }) {
  if (!open || !chart) return null

  const rows = normalizeRows(chart.rows)
  const columns =
    rows.length > 0 && rows[0].label && !rows[0].value
      ? Object.keys(chart.rows[0] || {})
      : ['Size', 'Measurement']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close size chart"
        onClick={onClose}
      />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-auto rounded-xl border border-[#e8d5c0] bg-[#fffdf9] p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bodoni text-lg text-ink">{chart.name || 'Size chart'}</h2>
            {chart.type ? (
              <p className="text-xs text-muted capitalize mt-0.5">{chart.type} sizing</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d8c4a7] px-2 py-1 text-sm text-muted hover:text-ink"
          >
            ×
          </button>
        </div>

        {rows.length ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#f0e6d6]">
                {columns.length > 2 ? (
                  columns.map((col) => (
                    <th key={col} className="px-2 py-2 text-xs font-medium text-muted">
                      {col}
                    </th>
                  ))
                ) : (
                  <>
                    <th className="px-2 py-2 text-xs font-medium text-muted">Size</th>
                    <th className="px-2 py-2 text-xs font-medium text-muted">Measurement</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {chart.rows?.map((row, i) => {
                if (row?.label != null || row?.value != null) {
                  return (
                    <tr key={i} className="border-b border-[#f0e6d6] last:border-0">
                      <td className="px-2 py-2 text-ink">{row.label}</td>
                      <td className="px-2 py-2 text-muted">{row.value}</td>
                    </tr>
                  )
                }
                const keys = Object.keys(row || {})
                return (
                  <tr key={i} className="border-b border-[#f0e6d6] last:border-0">
                    {keys.map((k) => (
                      <td key={k} className="px-2 py-2 text-ink">
                        {row[k]}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">No size data available.</p>
        )}
      </div>
    </div>
  )
}
