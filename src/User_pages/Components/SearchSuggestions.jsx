import React from 'react'
import { Link } from 'react-router-dom'
import { productImageUrl } from '../../utils/cloudinaryImage'

function SearchSuggestions({ products, categories, onSelect, className = '' }) {
  if (!products.length && !categories.length) return null

  return (
    <div
      className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#dcc6a6] bg-[#fffdf9] shadow-[0_20px_40px_-24px_rgba(58,21,29,0.55)] ${className}`}
      role="listbox"
    >
      {categories.length > 0 ? (
        <div className="border-b border-[#eadfc9] px-3 py-2">
          <p className="px-2 py-1 font-playfair text-[10px] uppercase tracking-[0.1em] text-muted">
            Categories
          </p>
          <ul>
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link
                  to={cat.href}
                  role="option"
                  onClick={onSelect}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 font-playfair text-sm text-ink hover:bg-[#f7ecee]"
                >
                  <i className="fa-solid fa-gem text-xs text-gold" aria-hidden />
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {products.length > 0 ? (
        <ul className="max-h-64 overflow-y-auto py-2">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                to={`/product/${p.id}`}
                role="option"
                onClick={onSelect}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7ecee]"
              >
                {p.image ? (
                  <img
                    src={productImageUrl(p.image, 'thumb')}
                    alt=""
                    className="h-12 w-10 rounded-lg bg-[#f8f2e7] object-contain"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-playfair text-sm text-ink">{p.name}</span>
                  <span className="text-xs text-gold">₹{Number(p.price || 0).toLocaleString()}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default SearchSuggestions
