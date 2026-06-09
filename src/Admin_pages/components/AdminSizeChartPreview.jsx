import React from 'react'
import { getChartColumns } from '../utils/sizeChartForm'

function AdminSizeChartPreview({ name, type, rows = [], compact = false }) {
  const columns = getChartColumns(rows)
  const hasData = rows.length > 0 && columns.length > 0

  return (
    <div className={`admin-size-chart-preview ${compact ? 'admin-size-chart-preview--compact' : ''}`}>
      {!compact ? (
        <div className="admin-size-chart-preview__header">
          <div>
            <p className="admin-section-title text-base">{name || 'Untitled chart'}</p>
            {type ? <p className="admin-body-sm capitalize">{type} sizing</p> : null}
          </div>
        </div>
      ) : null}

      {hasData ? (
        <div className="overflow-x-auto">
          <table className="admin-size-chart-preview__table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                if (row?.label != null || row?.value != null) {
                  return (
                    <tr key={i}>
                      <td>{row.label}</td>
                      <td className="text-muted">{row.value}</td>
                    </tr>
                  )
                }
                return (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col}>{row[col] ?? '—'}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-size-chart-preview__empty">Add rows to see a live preview.</p>
      )}
    </div>
  )
}

export default AdminSizeChartPreview
