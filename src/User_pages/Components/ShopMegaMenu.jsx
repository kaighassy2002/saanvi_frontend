import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../hooks/useShopCategories'
import { SHOP_QUICK_LINKS, categoryCollectionHref } from '../data/shopNav'

function ShopMegaMenu({ variant = 'desktop', onNavigate, inHero = false }) {
  const { categories, loading } = useShopCategories()
  const linkClass =
    variant === 'mobile'
      ? 'block rounded-lg px-3 py-2 font-playfair text-sm text-muted hover:bg-[#f7ecee] hover:text-[#7a2c3a]'
      : 'rounded-lg px-2 py-1.5 font-playfair text-sm text-muted transition hover:bg-[#f7ecee] hover:text-[#7a2c3a]'

  const quickClass =
    variant === 'mobile'
      ? linkClass
      : 'font-playfair text-xs text-[#7a2c3a] hover:underline'

  const handleClick = () => onNavigate?.()

  const categoryLinks =
    loading && categories.length === 0 ? (
      <span className="px-3 py-2 text-xs text-muted">Loading categories…</span>
    ) : (
      categories.map((cat) => (
        <Link
          key={cat.name}
          to={categoryCollectionHref(cat.name)}
          className={linkClass}
          onClick={handleClick}
        >
          {cat.name}
        </Link>
      ))
    )

  if (variant === 'mobile') {
    return (
      <div className="mt-2 border-t border-[#eadfc9]/80 pt-3">
        <p className="px-3 py-1 font-playfair text-[10px] uppercase tracking-[0.12em] text-muted">
          Shop by category
        </p>
        <div className="grid grid-cols-2 gap-1 px-2 pb-2">{categoryLinks}</div>
        <div className="flex flex-col gap-1 border-t border-[#eadfc9]/60 px-2 pt-2">
          {SHOP_QUICK_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className={linkClass} onClick={handleClick}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`pointer-events-none absolute left-0 top-full z-50 pt-2 opacity-0 transition group-hover/shop:pointer-events-auto group-hover/shop:opacity-100 group-focus-within/shop:pointer-events-auto group-focus-within/shop:opacity-100 ${
        inHero ? '' : ''
      }`}
    >
      <div className="w-[min(100vw-2rem,42rem)] rounded-2xl border border-[#dcc6a6] bg-[#fffdf9] p-5 shadow-[0_24px_48px_-28px_rgba(58,21,29,0.55)]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">{categoryLinks}</div>
        <div className="mt-4 flex flex-wrap gap-4 border-t border-[#eadfc9] pt-4">
          {SHOP_QUICK_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className={quickClass} onClick={handleClick}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ShopMegaMenu
