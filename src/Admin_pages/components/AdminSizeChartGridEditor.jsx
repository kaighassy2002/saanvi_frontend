import React from 'react'

function AdminSizeChartGridEditor({ columns, gridRows, onChange }) {
  const updateColumn = (index, value) => {
    const next = [...columns]
    next[index] = value
    onChange({ columns: next, gridRows })
  }

  const updateCell = (rowIndex, colIndex, value) => {
    const next = gridRows.map((row, ri) =>
      ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : [...row]
    )
    onChange({ columns, gridRows: next })
  }

  const addRow = () => {
    onChange({ columns, gridRows: [...gridRows, columns.map(() => '')] })
  }

  const removeRow = (rowIndex) => {
    if (gridRows.length <= 1) return
    onChange({ columns, gridRows: gridRows.filter((_, i) => i !== rowIndex) })
  }

  const addColumn = () => {
    const label = `Column ${columns.length + 1}`
    onChange({
      columns: [...columns, label],
      gridRows: gridRows.map((row) => [...row, '']),
    })
  }

  const removeColumn = (colIndex) => {
    if (columns.length <= 1) return
    onChange({
      columns: columns.filter((_, i) => i !== colIndex),
      gridRows: gridRows.map((row) => row.filter((_, i) => i !== colIndex)),
    })
  }

  const inputClass =
    'w-full min-w-[72px] rounded-md border border-[#e8d5c0] bg-white px-2 py-1.5 text-xs text-ink outline-none transition focus:border-[#c9a34a] focus:ring-1 focus:ring-[#c9a34a]/25'

  return (
    <div className="admin-size-chart-grid">
      <div className="admin-size-chart-grid__toolbar">
        <p className="text-xs text-muted">Edit sizes directly — changes reflect in the preview.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addRow} className="admin-size-chart-grid__btn">
            + Row
          </button>
          <button type="button" onClick={addColumn} className="admin-size-chart-grid__btn">
            + Column
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e8d5c0] bg-white">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-[#f0e6d6] bg-[#faf7f2]">
            <tr>
              {columns.map((col, colIndex) => (
                <th key={colIndex} className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <input
                      className={inputClass}
                      value={col}
                      onChange={(e) => updateColumn(colIndex, e.target.value)}
                      aria-label={`Column ${colIndex + 1} header`}
                    />
                    {columns.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeColumn(colIndex)}
                        className="admin-size-chart-grid__icon-btn"
                        aria-label="Remove column"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
              <th className="w-10 px-2 py-2" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {gridRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[#f0e6d6] last:border-0">
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="px-2 py-2">
                    <input
                      className={inputClass}
                      value={row[colIndex] ?? ''}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      placeholder="—"
                    />
                  </td>
                ))}
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    disabled={gridRows.length <= 1}
                    className="admin-size-chart-grid__icon-btn disabled:opacity-30"
                    aria-label="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminSizeChartGridEditor
