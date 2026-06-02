import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { fetchRazorpayConfig } from '../services/jewelleryApi'
import { getAdminSettings, putAdminSettings } from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import { STORE_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, STORE_LOCATION } from '../services/storefrontConstants'

const TABS = [
  { id: 'store', label: 'Store' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payments', label: 'Payments' },
  { id: 'integrations', label: 'Integrations' },
]

function AdminSettings() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'store'
  const [settings, setSettings] = useState(null)
  const [razorpay, setRazorpay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [s, rp] = await Promise.all([
        getAdminSettings(authFetch),
        fetchRazorpayConfig().catch(() => ({ enabled: false })),
      ])
      setSettings({
        storeName: s.storeName || STORE_NAME,
        supportEmail: s.supportEmail || SUPPORT_EMAIL,
        supportPhone: s.supportPhone || SUPPORT_PHONE,
        storeLocation: s.storeLocation || STORE_LOCATION,
        defaultGstPercent: s.defaultGstPercent ?? 3,
        defaultHsnCode: s.defaultHsnCode || '7113',
        shippingFee: s.shipping?.shippingFee ?? 99,
        freeShippingThreshold: s.shipping?.freeShippingThreshold ?? 2999,
      })
      setRazorpay(rp)
    } catch (e) {
      setError(e?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await putAdminSettings(authFetch, {
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        storeLocation: settings.storeLocation,
        defaultGstPercent: Number(settings.defaultGstPercent),
        defaultHsnCode: settings.defaultHsnCode,
        shipping: {
          shippingFee: Number(settings.shippingFee),
          freeShippingThreshold: Number(settings.freeShippingThreshold),
        },
      })
      toast('Settings saved.')
    } catch (e) {
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full max-w-md rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  if (loading) return <p className="text-muted text-sm">Loading…</p>

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Store settings" description="Configure store profile, shipping, and integrations." />

      <AdminErrorBanner message={error} onRetry={load} />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#e8d5c0]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSearchParams({ tab: t.id })}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition ${
              tab === t.id
                ? 'border-[#7a2c3a] text-ink font-medium'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {settings ? (
        <div className="lux-card p-6 space-y-4">
          {tab === 'store' ? (
            <>
              <div>
                <label className="block text-xs text-muted mb-1">Store name</label>
                <input className={inputClass} value={settings.storeName} onChange={(e) => setField('storeName', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Support email</label>
                <input className={inputClass} value={settings.supportEmail} onChange={(e) => setField('supportEmail', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Support phone</label>
                <input className={inputClass} value={settings.supportPhone} onChange={(e) => setField('supportPhone', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Location</label>
                <input className={inputClass} value={settings.storeLocation} onChange={(e) => setField('storeLocation', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-xs text-muted mb-1">Default GST %</label>
                  <input type="number" className={inputClass} value={settings.defaultGstPercent} onChange={(e) => setField('defaultGstPercent', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Default HSN code</label>
                  <input className={inputClass} value={settings.defaultHsnCode} onChange={(e) => setField('defaultHsnCode', e.target.value)} />
                </div>
              </div>
            </>
          ) : null}

          {tab === 'shipping' ? (
            <>
              <div>
                <label className="block text-xs text-muted mb-1">Shipping fee (₹)</label>
                <input type="number" min="0" className={inputClass} value={settings.shippingFee} onChange={(e) => setField('shippingFee', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Free shipping above (₹)</label>
                <input type="number" min="0" className={inputClass} value={settings.freeShippingThreshold} onChange={(e) => setField('freeShippingThreshold', e.target.value)} />
              </div>
            </>
          ) : null}

          {tab === 'payments' ? (
            <div className="text-sm space-y-2">
              <p>
                Razorpay:{' '}
                <strong className={razorpay?.enabled ? 'text-emerald-700' : 'text-muted'}>
                  {razorpay?.enabled ? 'Enabled' : 'Not configured'}
                </strong>
              </p>
              {razorpay?.keyId ? (
                <p className="text-xs text-muted font-mono break-all">Key: {razorpay.keyId}</p>
              ) : null}
              <p className="text-xs text-muted">Payment keys are configured via server environment variables.</p>
            </div>
          ) : null}

          {tab === 'integrations' ? (
            <div className="text-sm space-y-3">
              <p>
                Cloudinary image uploads: configure{' '}
                <code className="text-xs bg-[#f4e8db] px-1 rounded">CLOUDINARY_*</code> in backend .env
              </p>
              <p className="text-xs text-muted">Product images upload when adding products if Cloudinary is set up.</p>
            </div>
          ) : null}

          {tab !== 'payments' && tab !== 'integrations' ? (
            <button type="button" disabled={saving} onClick={handleSave} className="lux-button px-4 py-2 text-sm">
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default AdminSettings
