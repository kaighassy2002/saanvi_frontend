import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { useStoreSettings } from '../context/storeSettingsContext'
import { getShippingSettings, putShippingSettings } from './services/adminApi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import { formatInr } from '../services/storefrontConstants'

function AdminShipping() {
  const { authFetch } = useAdminAuth()
  const { refresh: refreshStorefront } = useStoreSettings()
  const [shippingFee, setShippingFee] = useState('')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const shipping = await getShippingSettings(authFetch)
      setShippingFee(String(shipping.shippingFee))
      setFreeShippingThreshold(String(shipping.freeShippingThreshold))
    } catch (e) {
      setError(e?.message || 'Failed to load shipping settings')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    const fee = Number(shippingFee)
    const threshold = Number(freeShippingThreshold)
    if (!Number.isFinite(fee) || fee < 0) {
      setError('Enter a valid shipping fee (0 or more).')
      return
    }
    if (!Number.isFinite(threshold) || threshold < 0) {
      setError('Enter a valid free-shipping order minimum (0 or more).')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const saved = await putShippingSettings(authFetch, {
        shippingFee: Math.round(fee),
        freeShippingThreshold: Math.round(threshold),
      })
      setShippingFee(String(saved.shippingFee))
      setFreeShippingThreshold(String(saved.freeShippingThreshold))
      await refreshStorefront()
      setMessage('Shipping settings saved. Cart and checkout will use the new values.')
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  const feeNum = Number(shippingFee)
  const thresholdNum = Number(freeShippingThreshold)
  const previewValid = Number.isFinite(feeNum) && feeNum >= 0 && Number.isFinite(thresholdNum) && thresholdNum >= 0

  return (
    <div className="max-w-xl">
      <AdminPageHeader
        title="Shipping"
        description="Flat shipping fee and free-shipping minimum shown on the storefront and applied at checkout."
        action={{ label: saving ? 'Saving…' : 'Save', onClick: handleSave }}
      />

      <AdminErrorBanner message={error} onRetry={load} />
      {message ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="lux-card space-y-5 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Shipping fee (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              placeholder="e.g. 99"
            />
            <span className="mt-1 block text-xs text-muted">
              Charged when order subtotal is below the free-shipping minimum. Use 0 for always free
              delivery.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Free shipping above (₹)</span>
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              placeholder="e.g. 2999"
            />
            <span className="mt-1 block text-xs text-muted">
              Orders at or above this subtotal get free shipping. Set to 0 to always apply the fee
              above (if any).
            </span>
          </label>

          {previewValid ? (
            <p className="rounded-lg bg-[#faf7f2] px-3 py-2 text-sm text-muted">
              Preview: orders under {formatInr(thresholdNum)} pay {formatInr(feeNum)} shipping;{' '}
              {formatInr(thresholdNum)} and above ship free.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default AdminShipping
