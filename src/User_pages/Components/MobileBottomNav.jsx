import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useWishlist } from '../../hooks/useWishlist'

const navItems = [
  { to: '/', label: 'Home', icon: 'fa-house', end: true },
  { to: '/collections', label: 'Shop', icon: 'fa-gem', end: false },
  { to: '/wishlist', label: 'Saved', icon: 'fa-heart', end: false },
  { to: '/cart', label: 'Cart', icon: 'fa-cart-shopping', end: false },
]

/** Fixed bottom navigation for thumb-friendly mobile browsing. */
function MobileBottomNav() {
  const location = useLocation()
  const { itemCount: cartItemCount } = useCart()
  const { itemCount: wishlistItemCount } = useWishlist()

  const hideOn = ['/auth', '/checkout', '/admin', '/admin/login']
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#dcc6a6] bg-[#fffdf9]/96 backdrop-blur-xl lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-h-[52px] min-w-[4rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 font-playfair text-[10px] transition ${
                isActive ? 'text-[#7a2c3a]' : 'text-muted'
              }`
            }
          >
            <span className="relative">
              <i className={`fa-solid ${item.icon} text-lg`} aria-hidden />
              {item.to === '/cart' && cartItemCount > 0 ? (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-ink">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              ) : null}
              {item.to === '/wishlist' && wishlistItemCount > 0 ? (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7a2c3a] px-1 text-[9px] font-semibold text-white">
                  {wishlistItemCount > 9 ? '9+' : wishlistItemCount}
                </span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileBottomNav
