/**
 * Featured Items admin page.
 * Loads all published items from Goks and lets the admin pick up to 12 to feature
 * on the Saanvi home page (New Arrivals section).
 */
import React, { useState, useEffect } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'

const MAX_FEATURED = 12

function AdminFeatured() {
  const { authFetch } = useAdminAuth()
  const [allItems, setAllItems] = useState([])
  const [featuredIds, setFeaturedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [config, items] = await Promise.all([
          authFetch('/api/v1/storefront/config'),
          authFetch('/api/v1/storefront/published'),
        ])
        setFeaturedIds(config.featured_ids || [])
        setAllItems(items || [])
      } catch (err) {
        setMessage(err?.message || 'Failed to load')
        setMessageTone('error')
      } finally {
        setLoading(false)
      }
    }
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
      await authFetch('/api/v1/storefront/featured', {
        method: 'PUT',
        body: JSON.stringify({ featured_ids: featuredIds }),
      })
      setMessage('Featured items saved.')
      setMessageTone('success')
    } catch (err) {
      setMessage(err?.message || 'Save failed')
      setMessageTone('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-muted text-sm">Loading…</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-xl text-ink">Featured Items</h1>
          <p className="text-sm text-muted mt-1">
            Select up to {MAX_FEATURED} items to show in the home page highlights.
            {featuredIds.length === 0 && ' When none are selected, the 6 newest published items appear.'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="lux-button px-4 py-2 text-sm"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {message && (
        <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${messageTone === 'success' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
          {message}
        </p>
      )}

      <p className="text-xs text-muted mb-3">{featuredIds.length} / {MAX_FEATURED} selected</p>

      {allItems.length === 0 ? (
        <div className="lux-card p-6 text-center text-muted text-sm">
          No published items found. Publish items in the{' '}
          <a href="#" className="underline hover:text-gold">Goks inventory</a>.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allItems.map((item) => {
            const selected = featuredIds.includes(item.id)
            const disabled = !selected && featuredIds.length >= MAX_FEATURED
            return (
              <button
                key={item.id}
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
                <p className="text-xs text-muted capitalize mt-0.5">{item.item_type}</p>
                {selected && (
                  <p className="text-xs text-gold font-medium mt-1">✓ Featured</p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminFeatured
