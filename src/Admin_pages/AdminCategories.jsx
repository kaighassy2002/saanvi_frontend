import React, { useEffect, useMemo, useState } from 'react'
import { adminFetchCategories, adminFetchProducts, adminSaveCategories } from '../services/catalogService'

const SUGGESTED_CATEGORIES = [
  'Necklace',
  'Earrings',
  'Ring',
  'Bracelets',
  'Anklet',
  'Bangles',
  'Bridal Set',
  'Pendant',
  'Mangalsutra',
  'Nose Pin',
]

export default function AdminCategories() {
  const [list, setList] = useState([])
  const [products, setProducts] = useState([])
  const [newCat, setNewCat] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setError('')
    try {
      const [cats, prods] = await Promise.all([adminFetchCategories(), adminFetchProducts()])
      setList(cats)
      setProducts(prods)
    } catch (e) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function persist(next) {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await adminSaveCategories(next)
      setList(next)
      setMessage('Saved')
      setTimeout(() => setMessage(''), 2000)
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function addCategory(e) {
    e.preventDefault()
    const t = newCat.trim()
    if (!t || list.some((c) => c.toLowerCase() === t.toLowerCase())) return
    setNewCat('')
    persist([...list, t])
  }

  function quickAddCategory(cat) {
    if (saving) return
    if (list.some((c) => c.toLowerCase() === cat.toLowerCase())) return
    persist([...list, cat])
  }

  function removeCategory(c) {
    if (!window.confirm(`Remove category “${c}”? Products keep their category label.`)) return
    persist(list.filter((x) => x !== c))
  }

  const counts = useMemo(() => {
    const map = new Map()
    for (const p of products) {
      const cat = String(p.category || '').trim()
      if (!cat) continue
      map.set(cat.toLowerCase(), (map.get(cat.toLowerCase()) || 0) + 1)
    }
    return map
  }, [products])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) => c.toLowerCase().includes(q))
  }, [list, search])

  const pageCount = Math.max(1, Math.ceil(filteredList.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, currentPage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  if (loading) return <p className="font-playfair text-muted">Loading categories…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-bodoni text-3xl text-ink">Categories</h2>
        <p className="font-playfair text-sm text-muted">
          Used for filters and product assignment. “All” is always shown on the storefront.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-green-50 px-4 py-2 font-playfair text-sm text-green-800">{message}</p>
      ) : null}

      <form onSubmit={addCategory} className="lux-card flex flex-wrap gap-3 p-5">
        <input
          className="royal-input w-full flex-1 sm:min-w-[200px]"
          placeholder="New category name"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
        />
        <button type="submit" disabled={saving} className="lux-button whitespace-nowrap">
          Add
        </button>
      </form>

      <div className="lux-card space-y-3 p-5">
        <p className="font-playfair text-sm font-semibold text-ink">Quick add common categories</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CATEGORIES.map((cat) => {
            const exists = list.some((x) => x.toLowerCase() === cat.toLowerCase())
            return (
              <button
                key={cat}
                type="button"
                disabled={saving || exists}
                onClick={() => quickAddCategory(cat)}
                className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 font-playfair text-sm text-ink hover:border-[#7a2c3a] disabled:opacity-50"
              >
                {exists ? `${cat} added` : `+ ${cat}`}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full flex-1 sm:min-w-[220px]">
          <label className="form-label" htmlFor="admin-category-search">
            Search
          </label>
          <input
            id="admin-category-search"
            type="search"
            className="royal-input w-full"
            placeholder="Search category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:min-w-[130px] sm:w-auto">
          <label className="form-label" htmlFor="admin-category-page-size">
            Per page
          </label>
          <select
            id="admin-category-page-size"
            className="royal-input w-full"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <ul className="lux-card divide-y divide-[#eadfc9]">
        {list.length === 0 ? (
          <li className="px-5 py-10 text-center font-playfair text-muted">No custom categories yet.</li>
        ) : filteredList.length === 0 ? (
          <li className="px-5 py-10 text-center font-playfair text-muted">No categories match this search.</li>
        ) : (
          paginatedList.map((c) => (
            <li
              key={c}
              className="flex items-center justify-between gap-3 px-5 py-3 font-playfair text-ink"
            >
              <div>
                <span>{c}</span>
                <p className="text-xs text-muted">
                  Used by {counts.get(c.toLowerCase()) || 0} product
                  {(counts.get(c.toLowerCase()) || 0) === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => removeCategory(c)}
                className="text-sm text-red-800/80 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>

      {filteredList.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-playfair text-sm text-muted">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredList.length)}
            {' '}of {filteredList.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-playfair text-sm text-muted">
              Page {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded-full border border-[#d6c0a2] bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
