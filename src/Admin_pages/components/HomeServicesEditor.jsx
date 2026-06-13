import React, { useState } from 'react'
import { createEmptyHomeService } from '../../services/homeMerchandising'
import { formatFontAwesomeIcon } from '../../utils/fontAwesomeIcon'

const inputClass =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

const ICON_OPTIONS = [
  { value: 'fa-paper-plane', label: 'Shipping' },
  { value: 'fa-arrow-rotate-left', label: 'Returns' },
  { value: 'fa-wallet', label: 'Payment' },
  { value: 'fa-headset', label: 'Support' },
  { value: 'fa-shield-halved', label: 'Secure' },
  { value: 'fa-gift', label: 'Gift' },
  { value: 'fa-star', label: 'Quality' },
  { value: 'fa-truck', label: 'Delivery' },
]

function HomeServicesEditor({ services, onChange, usingDefaults }) {
  const [editingIndex, setEditingIndex] = useState(null)

  const updateService = (index, field, value) => {
    onChange(services.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const removeService = (index) => {
    onChange(services.filter((_, i) => i !== index))
    setEditingIndex(null)
  }

  const moveService = (index, direction) => {
    const next = [...services]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const addService = () => {
    onChange([...services, createEmptyHomeService()])
    setEditingIndex(services.length)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e8d5c0] bg-[#faf7f2] px-4 py-3">
        <p className="text-xs text-muted">
          {usingDefaults
            ? 'Showing current service cards (not saved yet). Use {{threshold}} in text for free-shipping amount.'
            : `${services.length} service card${services.length === 1 ? '' : 's'} saved.`}
        </p>
      </div>

      <ul className="space-y-3">
        {services.map((service, index) => {
          const isEditing = editingIndex === index
          return (
            <li key={`service-${index}`} className="lux-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4e8db] text-gold-dark">
                  <i className={formatFontAwesomeIcon(service.icon || 'fa-paper-plane')} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{service.title || 'Untitled'}</p>
                  <p className="text-xs text-muted">{service.text || 'No description'}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(isEditing ? null : index)}
                    className="rounded-lg border border-[#d8c4a7] px-2.5 py-1 text-xs font-medium"
                  >
                    {isEditing ? 'Close' : 'Edit'}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-3 border-t border-[#f0e6d6] pt-4">
                  <label className="block text-xs text-muted">
                    Icon
                    <select
                      className={`${inputClass} mt-1`}
                      value={service.icon || 'fa-paper-plane'}
                      onChange={(e) => updateService(index, 'icon', e.target.value)}
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Title"
                    value={service.title || ''}
                    onChange={(e) => updateService(index, 'title', e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Description (use {{threshold}} for shipping amount)"
                    value={service.text || ''}
                    onChange={(e) => updateService(index, 'text', e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveService(index, -1)}
                      className="rounded border border-[#e8d5c0] px-2 py-1 text-xs disabled:opacity-30"
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={index === services.length - 1}
                      onClick={() => moveService(index, 1)}
                      className="rounded border border-[#e8d5c0] px-2 py-1 text-xs disabled:opacity-30"
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-xs text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={addService}
        className="rounded-lg border border-dashed border-[#d8c4a7] px-4 py-2.5 text-sm text-muted hover:border-gold hover:text-ink"
      >
        + Add service card
      </button>
    </div>
  )
}

export default HomeServicesEditor
