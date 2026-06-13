import React from 'react'

const DEFAULT_ITEMS = [
  { icon: 'fa-shield-halved', label: 'Secure checkout' },
  { icon: 'fa-certificate', label: 'Quality assured' },
  { icon: 'fa-truck-fast', label: 'Fast delivery' },
  { icon: 'fa-arrow-rotate-left', label: 'Easy returns' },
]

function TrustStrip({ items = DEFAULT_ITEMS, className = '' }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 ${className}`}
      role="list"
      aria-label="Shopping guarantees"
    >
      {items.map((item) => (
        <div
          key={item.label}
          role="listitem"
          className="flex items-center gap-2.5 rounded-xl border border-[#e8dcc8] bg-white/80 px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5ead7] text-sm text-gold">
            <i className={`fa-solid ${item.icon}`} aria-hidden />
          </span>
          <span className="font-playfair text-xs leading-tight text-ink sm:text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default TrustStrip
