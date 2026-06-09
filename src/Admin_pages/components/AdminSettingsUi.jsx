import React from 'react'
import { Link } from 'react-router-dom'

export function SettingsSection({ title, description, children, action }) {
  return (
    <section className="rounded-xl border border-[#e8d5c0] bg-white overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e6d6] px-5 py-4 bg-[#faf7f2]">
        <div>
          <h3 className="admin-section-title text-base">{title}</h3>
          {description ? <p className="text-xs text-muted mt-0.5 max-w-xl">{description}</p> : null}
        </div>
        {action || null}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  )
}

export function SettingsField({ label, hint, error, children, htmlFor }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="block text-xs font-medium text-ink mb-1">{label}</span>
      {children}
      {error ? <p className="text-xs text-red-700 mt-1">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-muted mt-1">{hint}</p> : null}
    </label>
  )
}

export function IntegrationCard({ name, description, configured, detail, envHint }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 flex flex-wrap items-start justify-between gap-3 ${
        configured ? 'border-emerald-200 bg-emerald-50/50' : 'border-[#efe2d1] bg-[#faf7f2]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              configured ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {configured ? 'Connected' : 'Not configured'}
          </span>
        </div>
        <p className="text-xs text-muted mt-1">{description}</p>
        {detail ? (
          <p className="text-[11px] text-muted font-mono mt-1 break-all">{detail}</p>
        ) : null}
        {envHint && !configured ? (
          <p className="text-[11px] text-muted mt-2">
            Set <code className="bg-white/80 px-1 rounded">{envHint}</code> in backend .env
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function MerchandisingHint() {
  return (
    <p className="text-xs text-muted rounded-lg bg-[#faf7f2] border border-[#efe2d1] px-3 py-2">
      Homepage hero, featured products, and category tiles are managed in{' '}
      <Link to="/admin/merchandising" className="text-[#7a2c3a] font-medium hover:underline">
        Merchandising
      </Link>
      .
    </p>
  )
}

export const INPUT_CLASS =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-[#9f7a2c] focus:outline-none focus:ring-1 focus:ring-[#9f7a2c]/30'

export const SELECT_CLASS = INPUT_CLASS
