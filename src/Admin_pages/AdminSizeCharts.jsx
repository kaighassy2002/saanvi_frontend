import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createSizeChart,
  deleteSizeChart,
  listSizeCharts,
  updateSizeChart,
} from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import { useAdminToast } from './shared/AdminToastProvider'

const emptyForm = () => ({
  name: '',
  type: 'ring',
  rowsText: 'Size,US,IN\n6,4,12',
})

function parseRows(text) {
  const lines = String(text || '')
    .trim()
    .split('\n')
    .filter(Boolean)
  if (!lines.length) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    const row = {}
    headers.forEach((h, i) => {
      row[h] = cells[i] || ''
    })
    return row
  })
}

function rowsToText(rows) {
  if (!Array.isArray(rows) || !rows.length) return emptyForm().rowsText
  const keys = Object.keys(rows[0])
  const header = keys.join(',')
  const body = rows.map((r) => keys.map((k) => r[k] ?? '').join(',')).join('\n')
  return `${header}\n${body}`
}

function AdminSizeCharts() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setRows(await listSizeCharts(authFetch))
    } catch (e) {
      setError(e?.message || 'Failed to load size charts')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (row) => {
    setEditId(row.id)
    setForm({
      name: row.name || '',
      type: row.type || 'ring',
      rowsText: rowsToText(row.rows),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        rows: parseRows(form.rowsText),
      }
      if (editId) {
        await updateSizeChart(authFetch, editId, body)
        toast('Size chart updated.')
      } else {
        await createSizeChart(authFetch, body)
        toast('Size chart created.')
      }
      setForm(emptyForm())
      setEditId(null)
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
      setDeleteTarget(null)
      toast('Size chart deleted.')
      await load()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Size charts"
        description="Ring, bangle, and necklace sizing tables linked to categories."
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <form onSubmit={handleSubmit} className="lux-card p-5 mb-6 space-y-3">
        <h2 className="font-playfair text-sm">{editId ? 'Edit' : 'New'} size chart</h2>
        <input className={inputClass} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="ring">Ring</option>
          <option value="bangle">Bangle</option>
          <option value="necklace">Necklace</option>
          <option value="general">General</option>
        </select>
        <textarea
          className={`${inputClass} font-mono text-xs`}
          rows={6}
          value={form.rowsText}
          onChange={(e) => setForm({ ...form, rowsText: e.target.value })}
          placeholder="CSV: header row then data rows"
        />
        <button type="submit" disabled={saving} className="lux-button px-4 py-2 text-sm">
          {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
        </button>
      </form>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="lux-card p-4 flex justify-between items-center gap-4">
              <div>
                <p className="font-medium text-ink">{row.name}</p>
                <p className="text-xs text-muted capitalize">{row.type} · {row.rows?.length || 0} rows</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => startEdit(row)} className="text-xs border border-[#d8c4a7] rounded px-2 py-1">
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(row)} className="text-xs border border-red-200 text-red-700 rounded px-2 py-1">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete size chart"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminSizeCharts
