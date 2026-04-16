import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useWishlist } from '../../hooks/useWishlist'
import { STORAGE_KEYS } from '../../services/config'
import { notifyCustomerSessionChanged } from '../../services/customerStorageScope'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/collections', label: 'Collections' },
]

function readCustomerSession() {
  const token = localStorage.getItem(STORAGE_KEYS.customerToken)
  let profile = null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customerProfile)
    if (raw) profile = JSON.parse(raw)
  } catch {
    profile = null
  }
  return { token, profile }
}

/** Navbar label: first name only (never email). */
function customerDisplayName(profile) {
  if (profile && typeof profile === 'object') {
    const fn = String(profile.firstName || '').trim()
    if (fn) return fn
    const fullName = String(profile.name || '').trim()
    if (fullName) {
      const first = fullName.split(/\s+/)[0]
      if (first) return first
    }
  }
  return 'Account'
}

function SiteHeader({ showSearch = true, inHero = false }) {
  const { totalQuantity } = useCart()
  const { count: wishlistCount } = useWishlist()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [customerSession, setCustomerSession] = useState(() => readCustomerSession())
  const navigate = useNavigate()

  const isSignedIn = Boolean(customerSession.token)
  const displayName = customerDisplayName(customerSession.profile)

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-[11px] font-medium tracking-[0.14em] uppercase transition-all duration-300 ${
      isActive
        ? inHero
          ? 'bg-[#f5ddb012] text-[#f1d08b] shadow-[inset_0_0_0_1px_rgba(241,208,139,0.28)]'
          : 'bg-[#f7ecee] text-gold shadow-[inset_0_0_0_1px_rgba(201,163,74,0.2)]'
        : inHero
          ? 'text-[#f2dfbf] hover:bg-[#ffffff12] hover:text-gold'
          : 'text-muted hover:bg-[#f9f0e4] hover:text-gold'
    }`

  const heroIconButtonClass =
    'group relative flex h-11 w-11 items-center justify-center rounded-full bg-[#14090c66] text-[#f2dfbf] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#1d0d11cc] hover:text-gold'

  const defaultIconButtonClass =
    'group relative flex h-11 w-11 items-center justify-center rounded-full bg-[#fff2df] text-muted shadow-[0_14px_26px_-24px_rgba(58,21,29,0.58)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#f9ecd7] hover:text-gold'

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchText.trim()
    navigate(trimmed ? `/collections?search=${encodeURIComponent(trimmed)}` : '/collections')
  }

  const handleCustomerLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.customerToken)
    localStorage.removeItem(STORAGE_KEYS.customerProfile)
    notifyCustomerSessionChanged()
    setCustomerSession({ token: null, profile: null })
    setShowProfileMenu(false)
    setIsMenuOpen(false)
    navigate('/')
  }

  const closeProfileMenu = () => setShowProfileMenu(false)

  return (
    <header
      className={
        inHero
          ? 'absolute inset-x-0 top-0 z-50'
          : 'sticky top-0 z-50 border-b border-[#dcc6a6] bg-[#fffaf2]/95 shadow-[0_10px_28px_-24px_rgba(58,21,29,0.65)] backdrop-blur-xl'
      }
    >
      <div className="section-container py-4">
        <div
          className={`flex items-center justify-between gap-4 rounded-full px-4 py-3 sm:px-6 ${
            inHero
              ? 'border border-[#f2d9ab40] bg-[#12070acc] shadow-[0_28px_54px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl'
              : 'bg-transparent'
          }`}
        >
        <Link
          to="/"
          className={`font-bodoni text-2xl tracking-[0.28em] sm:text-3xl ${inHero ? 'text-[#fff0d8]' : 'text-ink'}`}
        >
          SAANVI
        </Link>

        <button
          type="button"
          className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl md:hidden ${
            inHero
              ? 'border-[#f2d9ab52] bg-[#14090c99] text-[#f2dfbf]'
              : 'border-[#dcc6a6] bg-[#fff6eb] text-muted'
          }`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>

        <div className="hidden items-center gap-6 lg:flex">
          <nav className="flex items-center gap-2 font-playfair">
            {navItems.map((item) => (
              <NavLink key={item.label} to={item.to} className={navLinkClass} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {showSearch && (
            <form className="relative" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search jewellery..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`w-60 rounded-full py-3 pl-5 pr-11 text-sm outline-none transition ${
                  inHero
                    ? 'border border-[#f2d9ab52] bg-[#14090c99] text-[#f5e6cc] placeholder:text-[#f5e6cca8] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md focus:border-[#f2d9ab] focus:ring-2 focus:ring-[#f2d9ab40]'
                    : 'border border-[#dcc6a6] bg-[#fff6eb] text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-[#7a2c3a] focus:ring-2 focus:ring-[#7a2c3a]/20'
                }`}
              />
              <button
                type="submit"
                aria-label="Search products"
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm transition ${
                  inHero ? 'text-[#f2dfbf] hover:text-gold' : 'text-muted hover:text-[#7a2c3a]'
                }`}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>
          )}

          <div className={`flex items-center gap-2 ${inHero ? 'text-[#f2dfbf]' : 'text-muted'}`}>
            <Link
              to="/wishlist"
              className={inHero ? heroIconButtonClass : defaultIconButtonClass}
              aria-label="Wishlist"
            >
              <i className="fa-regular fa-heart"></i>
              {wishlistCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink sm:text-xs">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              ) : null}
            </Link>
            <Link
              to="/cart"
              className={inHero ? heroIconButtonClass : defaultIconButtonClass}
              aria-label="Shopping cart"
            >
              <i className="fa-solid fa-cart-shopping"></i>
              {totalQuantity > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink sm:text-xs">
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              ) : null}
            </Link>
            {isSignedIn ? (
              <div className="relative">
                <button
                  type="button"
                  className={`flex max-w-[11rem] items-center gap-2 rounded-full px-3 py-2 text-left transition duration-300 hover:-translate-y-0.5 hover:text-gold ${
                    inHero ? 'text-[#f2dfbf]' : 'text-muted'
                  } ${
                    inHero
                      ? 'bg-[#14090c66] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md hover:bg-[#1d0d11cc]'
                      : 'bg-[#fff2df] shadow-[0_14px_26px_-24px_rgba(58,21,29,0.58)] hover:bg-[#f9ecd7]'
                  }`}
                  aria-label="Account menu"
                  aria-expanded={showProfileMenu}
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                >
                  <span className="truncate font-playfair text-sm tracking-[0.08em]">{displayName}</span>
                  <i className="fa-regular fa-user shrink-0 text-lg" aria-hidden />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[#dcc6a6] bg-[#fffaf2] p-2 text-sm text-ink shadow-lg">
                    <Link
                      to="/orders"
                      className="block rounded-lg px-3 py-2 hover:bg-[#f7ecee]"
                      onClick={closeProfileMenu}
                    >
                      Orders
                    </Link>
                    <Link
                      to="/profile"
                      className="block rounded-lg px-3 py-2 hover:bg-[#f7ecee]"
                      onClick={closeProfileMenu}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[#f7ecee]"
                      onClick={handleCustomerLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/auth" className={navLinkClass} end>
                Sign in
              </NavLink>
            )}
          </div>
        </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className={`border-t px-4 py-4 md:hidden ${
            inHero
              ? 'border-[#f2d9ab66] bg-[#2a1116ed] backdrop-blur'
              : 'border-[#dcc6a6] bg-[#fffaf2]'
          }`}
        >
          <nav className="flex flex-col gap-3 font-playfair">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={navLinkClass}
                end={item.end}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/wishlist" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
              Wishlist
            </NavLink>
            <NavLink to="/cart" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
              Cart
            </NavLink>
            {isSignedIn ? (
              <>
                <NavLink to="/profile" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
                  Profile
                </NavLink>
                <NavLink to="/orders" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
                  Orders
                </NavLink>
                <button
                  type="button"
                  className={`text-left text-sm tracking-[0.12em] uppercase transition-colors ${
                    inHero ? 'text-[#f2dfbf] hover:text-gold' : 'text-muted hover:text-gold'
                  }`}
                  onClick={handleCustomerLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/auth" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
                Login/Register
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default SiteHeader
