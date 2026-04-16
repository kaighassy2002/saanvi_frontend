import React, { useEffect, useState } from 'react'
import {
  adminFetchNewArrivalIds,
  adminFetchProducts,
  adminSaveNewArrivalIds,
} from '../services/catalogService'

export default function AdminMerchandising() {
  const [products, setProducts] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const [prods, ids] = await Promise.all([adminFetchProducts(), adminFetchNewArrivalIds()])
      const published = prods.filter((p) => p.published !== false)
      setProducts(published)
      const valid = ids.filter((id) => published.some((p) => String(p.id) === String(id)))
      setSelectedIds(valid.length > 0 ? valid : published.slice(0, 6).map((p) => p.id))
    } catch (e) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function toggleId(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      return [...prev, id]
    })
  }

  function move(id, dir) {
    setSelectedIds((prev) => {
      const i = prev.indexOf(id)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await adminSaveNewArrivalIds(selectedIds)
      setMessage('New arrivals updated — home page will follow this order.')
      setTimeout(() => setMessage(''), 3500)
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="font-playfair text-muted">Loading…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-bodoni text-3xl text-ink">New arrivals</h2>
        <p className="font-playfair text-sm text-muted">
          Choose published products and order them for the home carousel. Empty selection falls back to
          the first six products.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-green-50 px-4 py-2 font-playfair text-sm text-green-800">{message}</p>
      ) : null}

      <div className="lux-card divide-y divide-[#eadfc9]">
        <div className="p-5">
          <p className="font-playfair text-sm font-semibold text-ink">Carousel order</p>
          <ul className="mt-3 space-y-2">
            {selectedIds.length === 0 ? (
              <li className="font-playfair text-sm text-muted">None selected</li>
            ) : (
              selectedIds.map((id) => {
                const p = products.find((x) => x.id === id)
                if (!p) return null
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#eadfc9] bg-[#fffaf3] px-3 py-2 font-playfair text-sm"
                  >
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="rounded-lg border border-[#d6c0a2] px-2 py-0.5 hover:bg-white"
                        onClick={() => move(id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-[#d6c0a2] px-2 py-0.5 hover:bg-white"
                        onClick={() => move(id, 1)}
                      >
                        ↓
                      </button>
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-5">
          <p className="mb-3 font-playfair text-sm font-semibold text-ink">Published products</p>
          <ul className="space-y-2">
            {products.map((p) => {
              const checked = selectedIds.includes(p.id)
              return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2 py-2 hover:border-[#eadfc9]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(p.id)}
                      className="h-4 w-4 accent-[#7a2c3a]"
                    />
                    <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="font-playfair text-sm text-ink">{p.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <button type="button" disabled={saving} onClick={handleSave} className="lux-button">
        {saving ? 'Saving…' : 'Save new arrivals'}
      </button>
    </div>
  )
}
