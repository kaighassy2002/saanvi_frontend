import React, { useState, useEffect } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { getNewArrivals, listProducts, putNewArrivals } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'

const MAX_FEATURED = 12

function AdminMerchandising() {
  const { authFetch } = useAdminAuth()
  const [allItems, setAllItems] = useState([])
  const [featuredIds, setFeaturedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [ids, products] = await Promise.all([
        getNewArrivals(authFetch),
        listProducts(authFetch),
      ])
      setFeaturedIds(ids)
      setAllItems(products.filter((p) => p.published !== false))
    } catch (err) {
      setError(err?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [authFetch])

  const toggleItem = (id) => {
    setFeaturedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_FEATURED) return prev
      return [...prev, id]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await putNewArrivals(authFetch, featuredIds)
      setMessage('New arrivals saved.')
      setMessageTone('success')
    } catch (err) {
      setMessage(err?.message || 'Save failed')
      setMessageTone('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Merchandising"
        description={`Select up to ${MAX_FEATURED} products for the home page new-arrivals section. When none are selected, the 6 newest published items appear.`}
        action={{ label: saving ? 'Saving…' : 'Save', onClick: handleSave }}
      />

      <AdminErrorBanner message={error} onRetry={load} />

      {message ? (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${messageTone === 'success' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}
        >
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <>
          <p className="text-xs text-muted mb-3">
            {featuredIds.length} / {MAX_FEATURED} selected
          </p>
          {allItems.length === 0 ? (
            <div className="lux-card p-6 text-center text-muted text-sm">
              No published products. Add products first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allItems.map((item) => {
                const selected = featuredIds.includes(item.id)
                const disabled = !selected && featuredIds.length >= MAX_FEATURED
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !disabled && toggleItem(item.id)}
                    className={`lux-card p-3 text-left transition border-2 ${
                      selected
                        ? 'border-gold bg-[#fdf6ee]'
                        : disabled
                          ? 'border-transparent opacity-40 cursor-not-allowed'
                          : 'border-transparent hover:border-[#e8d5c0]'
                    }`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-md mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 bg-[#f4e8db] rounded-md mb-2 flex items-center justify-center text-muted text-xs">
                        No image
                      </div>
                    )}
                    <p className="text-xs font-medium text-ink line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted mt-0.5">{item.category}</p>
                    {selected ? <p className="text-xs text-gold font-medium mt-1">Selected</p> : null}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminMerchandising
