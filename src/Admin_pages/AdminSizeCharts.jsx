import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createSizeChart,
  deleteSizeChart,
  listSizeCharts,
  updateSizeChart,
} from './services/adminApi'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminPageHeader from './components/AdminPageHeader'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import AdminDataTable from './components/AdminDataTable'
import AdminSizeChartGridEditor from './components/AdminSizeChartGridEditor'
import AdminSizeChartPreview from './components/AdminSizeChartPreview'
import { useAdminToast } from './shared/AdminToastProvider'
import {
  SIZE_CHART_TEMPLATES,
  SIZE_CHART_TYPES,
  chartToForm,
  emptySizeChartForm,
  gridToRows,
  templateToForm,
} from './utils/sizeChartForm'

function TypeBadge({ type }) {
  const key = String(type || 'general').toLowerCase()
  return <span className={`admin-size-chart-type admin-size-chart-type--${key}`}>{type || 'general'}</span>
}

function TemplateIcon({ type }) {
  const paths = {
    ring: <circle cx="12" cy="12" r="7" />,
    bangle: <ellipse cx="12" cy="12" rx="8" ry="5.5" />,
    bracelet: <path d="M4 12a8 8 0 0 1 16 0" />,
    general: <path d="M4 7h16M4 12h16M4 17h10" />,
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      {paths[type] || paths.general}
    </svg>
  )
}

function AdminSizeCharts() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [charts, setCharts] = useState([])
  const [form, setForm] = useState(emptySizeChartForm)
  const [editId, setEditId] = useState(null)
  const [panelMode, setPanelMode] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const data = await listSizeCharts(authFetch)
      setCharts(data)
      return data
    } catch (e) {
      setError(e?.message || 'Failed to load size charts')
      setCharts([])
      return []
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  const openCreate = useCallback((templateKey) => {
    setEditId(null)
    setPanelMode('create')
    setForm(templateKey ? templateToForm(templateKey) : emptySizeChartForm())
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then((data) => {
      if (!cancelled && !data.length) openCreate()
    })
    return () => {
      cancelled = true
    }
  }, [load, openCreate])

  const filteredCharts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return charts
    return charts.filter(
      (c) =>
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.type || '').toLowerCase().includes(q)
    )
  }, [charts, search])

  const previewRows = useMemo(
    () => gridToRows(form.columns, form.gridRows),
    [form.columns, form.gridRows]
  )

  const editorOpen = panelMode != null
  const isCreating = panelMode === 'create'

  const openEdit = (chart) => {
    setEditId(chart.id)
    setPanelMode(chart.id)
    setForm(chartToForm(chart))
  }

  const closePanel = useCallback(() => {
    if (charts.length === 0) {
      openCreate()
      return
    }
    setPanelMode(null)
    setEditId(null)
    setForm(emptySizeChartForm())
  }, [charts.length, openCreate])

  const applyTemplate = (key) => {
    const t = templateToForm(key)
    setForm((prev) => ({
      ...prev,
      type: t.type,
      columns: t.columns,
      gridRows: t.gridRows,
      name: prev.name.trim() ? prev.name : t.name,
    }))
  }

  const handleGridChange = ({ columns, gridRows }) => {
    setForm((prev) => ({ ...prev, columns, gridRows }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('Chart name is required.', 'error')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        rows: gridToRows(form.columns, form.gridRows),
      }
      if (editId) {
        await updateSizeChart(authFetch, editId, body)
        toast('Size chart updated.')
      } else {
        await createSizeChart(authFetch, body)
        toast('Size chart created.')
      }
      setPanelMode(null)
      setEditId(null)
      setForm(emptySizeChartForm())
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSizeChart(authFetch, deleteTarget.id)
      if (editId === deleteTarget.id) closePanel()
      setDeleteTarget(null)
      toast('Size chart deleted.')
      const data = await load()
      if (!data.length) openCreate()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c9a34a] focus:ring-2 focus:ring-[#c9a34a]/20'

  const tableColumns = [
    { key: 'name', label: 'Chart name' },
    { key: 'type', label: 'Type' },
    { key: 'rows', label: 'Rows' },
    { key: 'actions', label: '' },
  ]

  return (
    <div className="admin-dashboard admin-size-charts-page">
      <AdminPageHeader
        title="Size charts"
        description={
          <>
            Sizing guides shown on product pages
            {!loading ? (
              <span className="font-medium text-ink">
                {' '}
                · {charts.length} chart{charts.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </>
        }
        action={charts.length > 0 && !editorOpen ? { label: 'New chart', onClick: () => openCreate() } : null}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      {loading ? (
        <div className="admin-size-charts-skeleton animate-pulse space-y-4">
          <div className="h-12 rounded-xl bg-[#f4e8db]" />
          <div className="h-96 rounded-2xl bg-[#f4e8db]" />
        </div>
      ) : (
        <>
          {charts.length > 0 && !editorOpen ? (
            <section className="admin-panel mb-5">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Your charts</h2>
                <button type="button" onClick={() => openCreate()} className="admin-view-all">
                  + New chart
                </button>
              </div>

              {charts.length > 2 ? (
                <div className="mb-4">
                  <input
                    className={inputClass}
                    placeholder="Search by name or type…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search size charts"
                  />
                </div>
              ) : null}

              <AdminDataTable
                columns={tableColumns}
                loading={false}
                emptyMessage={search ? 'No charts match your search.' : 'No size charts yet.'}
              >
                {filteredCharts.map((chart) => (
                  <tr
                    key={chart.id}
                    className="border-b border-[#f0e6d6] last:border-0 hover:bg-[#faf7f2] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ink">{chart.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={chart.type} />
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-muted">{chart.rows?.length || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(chart)}
                          className="admin-view-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(chart)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminDataTable>
            </section>
          ) : null}

          {editorOpen || charts.length === 0 ? (
            <form onSubmit={handleSubmit} className="admin-size-charts-workspace">
              {charts.length === 0 ? (
                <div className="admin-size-charts-onboard">
                  <p className="admin-size-charts-onboard__eyebrow">Get started</p>
                  <h2 className="admin-size-charts-onboard__title">Create your first size chart</h2>
                  <p className="admin-size-charts-onboard__text">
                    Pick a jewellery type below, customize the table, then link it to products in the catalog.
                  </p>
                </div>
              ) : (
                <div className="admin-size-charts-workspace__toolbar">
                  <div>
                    <h2 className="admin-panel-title">{isCreating ? 'New size chart' : 'Edit size chart'}</h2>
                    <p className="admin-section-subtitle">Changes appear on the product size guide modal.</p>
                  </div>
                  <button type="button" onClick={closePanel} className="admin-view-all">
                    ← Back to list
                  </button>
                </div>
              )}

              <div className="admin-size-charts-templates">
                {Object.entries(SIZE_CHART_TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key)}
                    className={`admin-size-charts-template-card ${form.type === t.type ? 'admin-size-charts-template-card--active' : ''}`}
                  >
                    <span className="admin-size-charts-template-card__icon">
                      <TemplateIcon type={t.type} />
                    </span>
                    <span className="admin-size-charts-template-card__label">{t.name.replace(' guide', '')}</span>
                  </button>
                ))}
              </div>

              <div className="admin-size-charts-workspace__body">
                <div className="admin-size-charts-workspace__main space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="admin-label mb-1.5 block">Chart name *</label>
                      <input
                        className={inputClass}
                        placeholder="e.g. Women's ring sizes"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="admin-label mb-1.5 block">Type</label>
                      <div className="flex flex-wrap gap-2">
                        {SIZE_CHART_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setForm({ ...form, type: t.value })}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                              form.type === t.value
                                ? 'bg-[#c9a34a] text-white shadow-sm'
                                : 'border border-[#e8d5c0] bg-white text-muted hover:border-[#d8c4a7] hover:text-ink'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <AdminSizeChartGridEditor
                    columns={form.columns}
                    gridRows={form.gridRows}
                    onChange={handleGridChange}
                  />

                  <div className="flex flex-wrap items-center gap-2 border-t border-[#f0e6d6] pt-4">
                    <button type="submit" disabled={saving} className="lux-button px-5 py-2 text-sm">
                      {saving ? 'Saving…' : editId ? 'Save changes' : 'Create chart'}
                    </button>
                    {editId ? (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(charts.find((c) => c.id === editId))}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>

                <aside className="admin-size-charts-workspace__preview">
                  <p className="admin-eyebrow mb-3">Live preview</p>
                  <AdminSizeChartPreview name={form.name} type={form.type} rows={previewRows} />
                  <p className="mt-3 text-[11px] leading-relaxed text-muted">
                    Assign this chart on any product under <strong className="font-medium text-ink">Basic info → Size chart</strong>.
                  </p>
                </aside>
              </div>
            </form>
          ) : null}
        </>
      )}

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete size chart"
        message={`Delete "${deleteTarget?.name}"? Products using this chart will no longer show a size guide.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminSizeCharts
