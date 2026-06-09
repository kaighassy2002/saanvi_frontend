import React from 'react'

function AdminDataTable({ columns, children, loading, emptyMessage = 'No data yet.' }) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-[#e8d5c0] bg-white">
        <table className="w-full text-left">
          <thead className="border-b border-[#e8d5c0] bg-[#faf7f2]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="admin-table-head px-4 py-3">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="admin-body">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-[#f0e6d6]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-[#f4e8db]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const rows = React.Children.toArray(children)
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[#e8d5c0] bg-white px-6 py-12 text-center">
        <p className="admin-body-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8d5c0] bg-white">
      <table className="w-full min-w-[720px] text-left">
        <thead className="border-b border-[#e8d5c0] bg-[#faf7f2]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="admin-table-head px-4 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="admin-body">{children}</tbody>
      </table>
    </div>
  )
}

export default AdminDataTable
