import React from 'react'
import { Link } from 'react-router-dom'

function Breadcrumbs({ items }) {
  if (!items?.length) return null
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 font-playfair text-xs text-muted sm:text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={item.label}>
            {index > 0 ? (
              <span className="text-[#c4b5a8]" aria-hidden>
                /
              </span>
            ) : null}
            {isLast || !item.to ? (
              <span className={isLast ? 'text-ink' : 'text-muted'} aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="transition hover:text-[#7a2c3a]">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export default Breadcrumbs
