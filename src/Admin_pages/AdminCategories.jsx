import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getCategories, putCategories } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'

function AdminCategories() {
  const { authFetch } = useAdminAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const cats = await getCategories(authFetch)
      setRows(cats.length > 0 ? cats.map((name) => ({ name: String(name) })) : [{ name: '' }])
    } catch (e) {
      setError(e?.message || 'Failed to load categories')
      setRows([{ name: '' }])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const addRow = () => setRows((prev) => [...prev, { name: '' }])

  const updateRow = (index, name) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { name } : r)))
  }

  const removeRow = (index) => {
    setRows((prev) => (prev.length <= 1 ? [{ name: '' }] : prev.filter((_, i) => i !== index)))
  }

  const moveRow = (index, dir) => {
    setRows((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  const handleSave = async () => {
    const categories = [...new Set(rows.map((r) => r.name.trim()).filter(Boolean))]
    if (categories.length === 0) {
      setError('Add at least one category before saving.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const saved = await putCategories(authFetch, categories)
      setRows(saved.map((name) => ({ name: String(name) })))
      setMessage('Categories saved.')
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'flex-1 rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-xl">
      <AdminPageHeader
        title="Categories"
        description="Shop categories used in product forms and the storefront catalog."
        action={{ label: saving ? 'Saving…' : 'Save all', onClick: handleSave }}
      />

      <AdminErrorBanner message={error} onRetry={load} />
      {message ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="lux-card p-5 space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className={inputClass}
                value={row.name}
                onChange={(e) => updateRow(index, e.target.value)}
                placeholder="Category name"
              />
              <button
                type="button"
                onClick={() => moveRow(index, -1)}
                disabled={index === 0}
                className="rounded border border-[#d8c4a7] px-2 py-1 text-xs disabled:opacity-40"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveRow(index, 1)}
                disabled={index === rows.length - 1}
                className="rounded border border-[#d8c4a7] px-2 py-1 text-xs disabled:opacity-40"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-muted hover:text-ink underline"
          >
            + Add category
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminCategories
