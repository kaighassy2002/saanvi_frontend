import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { useStoreSettings } from '../context/storeSettingsContext'
import { fetchRazorpayConfig } from '../services/jewelleryApi'
import { formatInr } from '../services/storefrontConstants'
import {
  DEFAULT_ANNOUNCEMENT_MESSAGE,
  resolveAnnouncementBar,
} from '../services/announcementBar'
import {
  INDIAN_STATES,
  payloadFromSettingsForm,
  settingsFormFromApi,
  validateSettingsForm,
} from '../services/storeSettingsNormalize'
import { getAdminSettings, getIntegrationsHealth, putAdminSettings } from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import {
  INPUT_CLASS,
  IntegrationCard,
  MerchandisingHint,
  SELECT_CLASS,
  SettingsField,
  SettingsSection,
} from './components/AdminSettingsUi'

const TABS = [
  { id: 'brand', label: 'Brand & contact' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'tax', label: 'Tax & invoices' },
  { id: 'checkout', label: 'Checkout & orders' },
  { id: 'integrations', label: 'Integrations' },
]

function emptyForm() {
  return settingsFormFromApi({})
}

function AdminSettings() {
  const { authFetch } = useAdminAuth()
  const { toast } = useAdminToast()
  const { refresh: refreshStorefront } = useStoreSettings()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'brand'

  const [form, setForm] = useState(emptyForm())
  const [savedForm, setSavedForm] = useState(emptyForm())
  const [fieldErrors, setFieldErrors] = useState({})
  const [integrations, setIntegrations] = useState(null)
  const [razorpay, setRazorpay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [s, health, rp] = await Promise.all([
        getAdminSettings(authFetch),
        getIntegrationsHealth(authFetch).catch(() => null),
        fetchRazorpayConfig().catch(() => ({ enabled: false })),
      ])
      const next = settingsFormFromApi(s)
      setForm(next)
      setSavedForm(next)
      setIntegrations(health)
      setRazorpay(rp)
      setFieldErrors({})
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
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSave = async () => {
    const clientErrors = validateSettingsForm(form)
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors)
      toast('Fix the highlighted fields before saving.', 'error')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = payloadFromSettingsForm(form)
      const saved = await putAdminSettings(authFetch, payload)
      const next = settingsFormFromApi(saved)
      setForm(next)
      setSavedForm(next)
      setFieldErrors({})
      await refreshStorefront()
      toast('Store settings saved. The storefront will reflect your changes.')
    } catch (e) {
      const apiErrors = e?.errors || e?.data?.errors
      if (apiErrors && typeof apiErrors === 'object') {
        setFieldErrors(apiErrors)
      }
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const feeNum = Number(form.shippingFee)
  const thresholdNum = Number(form.freeShippingThreshold)
  const shippingPreviewValid =
    Number.isFinite(feeNum) && feeNum >= 0 && Number.isFinite(thresholdNum) && thresholdNum >= 0

  const announcementPreview = resolveAnnouncementBar({
    announcementEnabled: form.announcementEnabled,
    announcementExtraMessage: form.announcementExtraMessage,
    announcementMessage: form.announcementMessage,
    announcementLinkLabel: form.announcementLinkLabel,
    announcementLinkUrl: form.announcementLinkUrl,
    announcementShowIcon: form.announcementShowIcon,
    freeShippingThreshold: shippingPreviewValid ? thresholdNum : form.freeShippingThreshold,
  })

  if (loading) {
    return (
      <div className="max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-[#f4e8db]" />
        <div className="h-64 rounded-xl bg-[#f4e8db]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl pb-24">
      <AdminPageHeader
        title="Store settings"
        description="Brand, shipping, tax, checkout rules, and integration status — changes apply to your live storefront."
        action={
          tab !== 'integrations'
            ? { label: saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved', onClick: handleSave }
            : undefined
        }
      />

      <AdminErrorBanner message={error} onRetry={load} />
      <MerchandisingHint />

      <div className="mt-6 flex flex-wrap gap-1 border-b border-[#e8d5c0]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSearchParams({ tab: t.id })}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition ${
              tab === t.id
                ? 'border-[#7a2c3a] text-ink font-medium'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {tab === 'brand' ? (
          <>
            <SettingsSection
              title="Store identity"
              description="Shown in footer, contact page, emails, and packing documents."
            >
              <SettingsField label="Store name *" error={fieldErrors.storeName} htmlFor="store-name">
                <input
                  id="store-name"
                  className={INPUT_CLASS}
                  value={form.storeName}
                  onChange={(e) => setField('storeName', e.target.value)}
                />
              </SettingsField>
              <SettingsField label="Location / city" hint="Short line for footer and invoices." htmlFor="store-location">
                <input
                  id="store-location"
                  className={INPUT_CLASS}
                  value={form.storeLocation}
                  onChange={(e) => setField('storeLocation', e.target.value)}
                  placeholder="Chennai, India"
                />
              </SettingsField>
            </SettingsSection>

            <SettingsSection title="Customer support" description="How shoppers reach you for orders and enquiries.">
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Support email" error={fieldErrors.supportEmail} htmlFor="support-email">
                  <input
                    id="support-email"
                    type="email"
                    className={INPUT_CLASS}
                    value={form.supportEmail}
                    onChange={(e) => setField('supportEmail', e.target.value)}
                  />
                </SettingsField>
                <SettingsField label="Support phone" error={fieldErrors.supportPhone} htmlFor="support-phone">
                  <input
                    id="support-phone"
                    className={INPUT_CLASS}
                    value={form.supportPhone}
                    onChange={(e) => setField('supportPhone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </SettingsField>
              </div>
              <SettingsField
                label="WhatsApp number"
                hint="Digits with country code, no + (e.g. 919876543210). Used for chat links site-wide."
                error={fieldErrors.whatsappPhone}
                htmlFor="whatsapp"
              >
                <input
                  id="whatsapp"
                  className={INPUT_CLASS}
                  value={form.whatsappPhone}
                  onChange={(e) => setField('whatsappPhone', e.target.value)}
                  placeholder="919876543210"
                />
              </SettingsField>
              <SettingsField label="Instagram URL" htmlFor="instagram">
                <input
                  id="instagram"
                  className={INPUT_CLASS}
                  value={form.instagramUrl}
                  onChange={(e) => setField('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/yourstore"
                />
              </SettingsField>
            </SettingsSection>

            <SettingsSection
              title="Announcement bar"
              description="Top banner on every storefront page — message, link, and icon are all editable."
            >
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.announcementEnabled}
                  onChange={(e) => setField('announcementEnabled', e.target.checked)}
                />
                Show announcement bar
              </label>

              <SettingsField
                label="Festival / promo line (optional)"
                hint="Extra text shown before the main message — e.g. Diwali sale, wedding season. Clear this when the offer ends."
                htmlFor="announcement-extra"
              >
                <input
                  id="announcement-extra"
                  className={INPUT_CLASS}
                  value={form.announcementExtraMessage}
                  onChange={(e) => setField('announcementExtraMessage', e.target.value)}
                  placeholder="Diwali festive edit — new temple sets"
                  disabled={!form.announcementEnabled}
                />
              </SettingsField>

              <SettingsField
                label="Main message"
                hint={`Use {{threshold}} for the free-shipping amount (from Shipping tab). Leave empty for: "${DEFAULT_ANNOUNCEMENT_MESSAGE}"`}
                htmlFor="announcement"
              >
                <input
                  id="announcement"
                  className={INPUT_CLASS}
                  value={form.announcementMessage}
                  onChange={(e) => setField('announcementMessage', e.target.value)}
                  placeholder={DEFAULT_ANNOUNCEMENT_MESSAGE}
                  disabled={!form.announcementEnabled}
                />
              </SettingsField>

              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField
                  label="Link label"
                  hint='e.g. "Shop now". Leave empty to hide the link.'
                  htmlFor="announcement-link-label"
                >
                  <input
                    id="announcement-link-label"
                    className={INPUT_CLASS}
                    value={form.announcementLinkLabel}
                    onChange={(e) => setField('announcementLinkLabel', e.target.value)}
                    placeholder="Shop now"
                    disabled={!form.announcementEnabled}
                  />
                </SettingsField>
                <SettingsField
                  label="Link URL"
                  hint="Internal path (/collections) or full URL (https://…)"
                  htmlFor="announcement-link-url"
                >
                  <input
                    id="announcement-link-url"
                    className={INPUT_CLASS}
                    value={form.announcementLinkUrl}
                    onChange={(e) => setField('announcementLinkUrl', e.target.value)}
                    placeholder="/collections"
                    disabled={!form.announcementEnabled}
                  />
                </SettingsField>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.announcementShowIcon}
                  onChange={(e) => setField('announcementShowIcon', e.target.checked)}
                  disabled={!form.announcementEnabled}
                />
                Show truck icon before message
              </label>

              <div className="rounded-lg bg-[#2a1116] px-4 py-2 text-center">
                {!announcementPreview.enabled ? (
                  <p className="text-xs text-[#f5ead7]/70 font-medium">Announcement bar hidden</p>
                ) : (
                  <p className="text-xs text-[#f5ead7] font-medium">
                    {announcementPreview.extraMessage ? (
                      <>
                        <span className="text-gold">{announcementPreview.extraMessage}</span>
                        <span className="mx-2 opacity-40" aria-hidden>
                          ·
                        </span>
                      </>
                    ) : null}
                    {announcementPreview.showIcon ? (
                      <i className="fa-solid fa-truck-fast mr-1.5 text-gold" aria-hidden />
                    ) : null}
                    {announcementPreview.message}
                    {announcementPreview.linkLabel ? (
                      <>
                        <span className="mx-2 opacity-40" aria-hidden>
                          |
                        </span>
                        <span className="text-gold">{announcementPreview.linkLabel}</span>
                      </>
                    ) : null}
                  </p>
                )}
              </div>
            </SettingsSection>
          </>
        ) : null}

        {tab === 'shipping' ? (
          <SettingsSection
            title="Delivery charges"
            description="Applied at cart and checkout. Use {{threshold}} in the announcement bar message for this amount."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsField label="Shipping fee (₹)" error={fieldErrors.shippingFee} htmlFor="ship-fee">
                <input
                  id="ship-fee"
                  type="number"
                  min={0}
                  className={INPUT_CLASS}
                  value={form.shippingFee}
                  onChange={(e) => setField('shippingFee', e.target.value)}
                />
              </SettingsField>
              <SettingsField
                label="Free shipping above (₹)"
                error={fieldErrors.freeShippingThreshold}
                htmlFor="ship-threshold"
              >
                <input
                  id="ship-threshold"
                  type="number"
                  min={0}
                  className={INPUT_CLASS}
                  value={form.freeShippingThreshold}
                  onChange={(e) => setField('freeShippingThreshold', e.target.value)}
                />
              </SettingsField>
            </div>
            {shippingPreviewValid ? (
              <div className="rounded-lg border border-[#e8d5c0] bg-[#faf7f2] px-4 py-3 text-sm text-ink">
                <p className="font-medium text-xs uppercase tracking-wide text-muted mb-1">Customer preview</p>
                Orders under {formatInr(thresholdNum)} pay {formatInr(feeNum)} shipping.{' '}
                {formatInr(thresholdNum)} and above ship free.
              </div>
            ) : null}
          </SettingsSection>
        ) : null}

        {tab === 'tax' ? (
          <SettingsSection
            title="GST & tax invoices"
            description="Used on admin GST invoice PDFs. Consult your CA for correct rates and HSN."
          >
            <SettingsField label="GSTIN" error={fieldErrors.storeGstin} htmlFor="gstin">
              <input
                id="gstin"
                className={INPUT_CLASS}
                value={form.storeGstin}
                onChange={(e) => setField('storeGstin', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
              />
            </SettingsField>
            <SettingsField
              label="Registered state"
              hint="Determines CGST+SGST vs IGST on invoices."
              htmlFor="store-state"
            >
              <select
                id="store-state"
                className={SELECT_CLASS}
                value={form.storeState}
                onChange={(e) => setField('storeState', e.target.value)}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </SettingsField>
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsField label="Default GST %" error={fieldErrors.defaultGstPercent} htmlFor="gst-pct">
                <input
                  id="gst-pct"
                  type="number"
                  min={0}
                  max={28}
                  step={0.1}
                  className={INPUT_CLASS}
                  value={form.defaultGstPercent}
                  onChange={(e) => setField('defaultGstPercent', e.target.value)}
                />
              </SettingsField>
              <SettingsField label="Default HSN code" htmlFor="hsn">
                <input
                  id="hsn"
                  className={INPUT_CLASS}
                  value={form.defaultHsnCode}
                  onChange={(e) => setField('defaultHsnCode', e.target.value)}
                  placeholder="7113"
                />
              </SettingsField>
            </div>
          </SettingsSection>
        ) : null}

        {tab === 'checkout' ? (
          <SettingsSection title="Payments & fulfilment rules">
            <label className="flex items-start gap-3 rounded-lg border border-[#efe2d1] p-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.codEnabled}
                onChange={(e) => setField('codEnabled', e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-ink">Cash on delivery (COD)</span>
                <span className="block text-xs text-muted mt-0.5">
                  When off, checkout only offers online payment (Razorpay must be configured).
                </span>
              </span>
            </label>
            <SettingsField
              label="High-value COD confirm threshold (₹)"
              error={fieldErrors.codConfirmThreshold}
              hint="COD orders at or above this total need admin verification before packing (reduces RTO)."
              htmlFor="cod-threshold"
            >
              <input
                id="cod-threshold"
                type="number"
                min={0}
                className={INPUT_CLASS}
                value={form.codConfirmThreshold}
                onChange={(e) => setField('codConfirmThreshold', e.target.value)}
              />
            </SettingsField>
          </SettingsSection>
        ) : null}

        {tab === 'integrations' ? (
          <SettingsSection
            title="Connected services"
            description="Secrets stay on the server (.env). This panel shows live status only."
          >
            <div className="space-y-3">
              <IntegrationCard
                name="Razorpay"
                description="UPI, cards, and netbanking at checkout."
                configured={integrations?.razorpay?.configured || razorpay?.enabled}
                detail={integrations?.razorpay?.keyId || razorpay?.keyId}
                envHint="RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET"
              />
              <IntegrationCard
                name="Email (Gmail)"
                description="Order confirmations, status updates, and password reset OTP."
                configured={integrations?.email?.configured}
                detail={
                  integrations?.email?.adminNotifyEmail
                    ? `Admin alerts → ${integrations.email.adminNotifyEmail}`
                    : null
                }
                envHint="GMAIL_USER + GMAIL_APP_PASSWORD"
              />
              <IntegrationCard
                name="Cloudinary"
                description="Product, hero, and category image uploads in admin."
                configured={integrations?.cloudinary?.configured}
                detail={integrations?.cloudinary?.cloudName}
                envHint="CLOUDINARY_CLOUD_NAME + API key/secret"
              />
              <IntegrationCard
                name="Shiprocket"
                description="AWB generation from order detail."
                configured={integrations?.couriers?.shiprocket}
                envHint="SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD"
              />
              <IntegrationCard
                name="Delhivery"
                description="Alternative courier AWB generation."
                configured={integrations?.couriers?.delhivery}
                envHint="DELHIVERY_API_TOKEN"
              />
            </div>
          </SettingsSection>
        ) : null}
      </div>

      {dirty && tab !== 'integrations' ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e8d5c0] bg-white/95 backdrop-blur px-4 py-3 lg:pl-64">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-ink">You have unsaved changes</p>
            <button type="button" disabled={saving} onClick={handleSave} className="lux-button px-5 py-2 text-sm">
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminSettings
