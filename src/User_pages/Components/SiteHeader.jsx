import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useCartDrawer } from '../../hooks/useCartDrawer'
import { useWishlist } from '../../hooks/useWishlist'
import { useCatalog } from '../../hooks/useCatalog'
import { useProductSearch } from '../../hooks/useProductSearch'
import { CUSTOMER_SESSION_CHANGED_EVENT, STORAGE_KEYS } from '../../services/config'
import { notifyCustomerSessionChanged } from '../../services/customerStorageScope'
import { getRecentSearches, pushRecentSearch } from '../../services/recentSearches'
import AnnouncementBar from './AnnouncementBar'
import BrandLogo from './BrandLogo'
import SearchSuggestions from './SearchSuggestions'
import ShopMegaMenu from './ShopMegaMenu'
import '../Styles/site-header.css'

const navItems = [{ to: '/', label: 'Home', end: true }]

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

function customerEmail(profile) {
  if (profile && typeof profile === 'object') {
    const email = String(profile.email || '').trim()
    if (email) return email
  }
  return ''
}

function SiteHeader({
  showSearch = true,
  inHero = false,
  showAnnouncement = true,
  staticOnMobile = false,
}) {
  const { itemCount: cartItemCount } = useCart()
  const { openDrawer } = useCartDrawer()
  const { itemCount: wishlistItemCount } = useWishlist()
  const { products } = useCatalog()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearches())
  const [customerSession, setCustomerSession] = useState(() => readCustomerSession())
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const searchWrapRef = useRef(null)
  const navigate = useNavigate()

  const { products: suggestionProducts, categories: suggestionCategories } = useProductSearch(
    products,
    searchText,
  )

  useEffect(() => {
    const sync = () => setCustomerSession(readCustomerSession())
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, sync)
    return () => window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, sync)
  }, [])

  const profileMenuRef = useRef(null)

  useEffect(() => {
    if (!suggestionsOpen && !showProfileMenu) return undefined
    const onDoc = (e) => {
      if (suggestionsOpen && searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSuggestionsOpen(false)
      }
      if (
        showProfileMenu &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [suggestionsOpen, showProfileMenu])

  const isSignedIn = Boolean(customerSession.token)
  const displayName = customerDisplayName(customerSession.profile)
  const customerEmailLabel = customerEmail(customerSession.profile)

  const navLinkClass = ({ isActive }) =>
    `site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}`

  const closeSearchUi = () => {
    setSearchOpen(false)
    setSuggestionsOpen(false)
    setIsMenuOpen(false)
    setSearchText('')
  }

  const runSearch = (query) => {
    const trimmed = query.trim()
    if (trimmed) {
      pushRecentSearch(trimmed)
      setRecentSearches(getRecentSearches())
    }
    navigate(trimmed ? `/collections?search=${encodeURIComponent(trimmed)}` : '/collections')
    closeSearchUi()
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    runSearch(searchText)
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
  const closeMenus = () => {
    setIsMenuOpen(false)
    setShowProfileMenu(false)
  }

  const headerPositionClass = inHero
    ? 'absolute inset-x-0 top-0'
    : staticOnMobile
      ? 'relative max-lg:shadow-none lg:sticky lg:top-0'
      : 'sticky top-0'

  const renderDesktopIconActions = () => (
    <>
      <Link to="/wishlist" className="site-header__icon-btn" aria-label="Wishlist">
        <i className="fa-regular fa-heart text-[0.95rem]" aria-hidden />
        {wishlistItemCount > 0 ? (
          <span className="site-header__badge">{wishlistItemCount > 99 ? '99+' : wishlistItemCount}</span>
        ) : null}
      </Link>
      <button type="button" className="site-header__icon-btn" aria-label="Cart" onClick={openDrawer}>
        <i className="fa-solid fa-cart-shopping text-[0.9rem]" aria-hidden />
        {cartItemCount > 0 ? (
          <span className="site-header__badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
        ) : null}
      </button>
    </>
  )

  const renderDesktopSearch = () =>
    showSearch ? (
      <div ref={searchWrapRef} className="site-header__search">
        <form onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Search necklaces, rings…"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setSuggestionsOpen(e.target.value.trim().length >= 2)
            }}
            onFocus={() => {
              if (searchText.trim().length >= 2) setSuggestionsOpen(true)
            }}
            className="site-header__search-input"
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search" className="site-header__search-btn">
            <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden />
          </button>
        </form>
        {suggestionsOpen ? (
          <SearchSuggestions
            products={suggestionProducts}
            categories={suggestionCategories}
            onSelect={closeSearchUi}
          />
        ) : null}
      </div>
    ) : null

  const renderAccount = () =>
    isSignedIn ? (
      <div className="relative" ref={profileMenuRef}>
        <button
          type="button"
          className="site-header__account-btn"
          aria-label="Account menu"
          aria-expanded={showProfileMenu}
          onClick={() => setShowProfileMenu((prev) => !prev)}
        >
          <i className="fa-regular fa-user shrink-0 text-sm" aria-hidden />
          <span className="site-header__account-name hidden sm:inline">{displayName}</span>
        </button>
        {showProfileMenu ? (
          <div className="site-header__dropdown" role="menu">
            <Link to="/orders" className="site-header__dropdown-link" onClick={closeProfileMenu} role="menuitem">
              Orders
            </Link>
            <Link to="/profile" className="site-header__dropdown-link" onClick={closeProfileMenu} role="menuitem">
              Profile
            </Link>
            <button
              type="button"
              className="site-header__dropdown-btn"
              onClick={handleCustomerLogout}
              role="menuitem"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    ) : (
      <NavLink to="/auth" className={navLinkClass} end>
        Sign in
      </NavLink>
    )

  return (
    <>
      <header
        className={`site-header z-50 ${inHero ? 'site-header--hero' : 'site-header--default'} ${headerPositionClass}`}
      >
        {showAnnouncement ? <AnnouncementBar variant={inHero ? 'hero' : 'default'} /> : null}

        <div className="section-container">
          <div className={`site-header__bar ${inHero ? 'site-header__bar--hero' : ''}`}>
            <BrandLogo variant={inHero ? 'hero' : 'default'} />

            <div className="site-header__cluster site-header__cluster--desktop">
              <nav className="site-header__nav" aria-label="Main">
                {navItems.map((item) => (
                  <NavLink key={item.label} to={item.to} className={navLinkClass} end={item.end}>
                    {item.label}
                  </NavLink>
                ))}
                <div className="site-header__shop-wrap group/shop">
                  <NavLink to="/collections" className={navLinkClass}>
                    Shop
                  </NavLink>
                  <ShopMegaMenu variant="desktop" inHero={inHero} onNavigate={closeMenus} />
                </div>
              </nav>
            </div>

            <div className="site-header__cluster site-header__cluster--actions">
              {renderDesktopSearch()}
              {renderDesktopIconActions()}
              {renderAccount()}
            </div>

            <div className="site-header__cluster site-header__cluster--mobile">
              {showSearch ? (
                <button
                  type="button"
                  className="site-header__icon-btn"
                  aria-label="Open search"
                  onClick={() => setSearchOpen(true)}
                >
                  <i className="fa-solid fa-magnifying-glass" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                className="site-header__icon-btn"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <i className={`fa-solid text-lg ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen ? (
          <div
            className={`site-header__menu lg:hidden ${inHero ? 'site-header__menu--hero' : ''}`}
            id="mobile-nav"
          >
            <div className="site-header__menu-panel">
              {showSearch ? (
                <form className="site-header__menu-search" onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="search"
                      placeholder="Search jewellery…"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className={
                        inHero
                          ? 'input-search border-[#f2d9ab52] bg-[#14090c66] text-[#f5e6cc]'
                          : 'input-search'
                      }
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                      aria-label="Search"
                    >
                      <i className="fa-solid fa-magnifying-glass" aria-hidden />
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="site-header__menu-scroll">
                <nav className="site-header__menu-nav" aria-label="Mobile">
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
                  <NavLink
                    to="/collections"
                    className={navLinkClass}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Shop all
                  </NavLink>
                  <ShopMegaMenu variant="mobile" inHero={inHero} onNavigate={() => setIsMenuOpen(false)} />
                </nav>

                <div className="site-header__menu-actions">
                  <NavLink
                    to="/wishlist"
                    className="site-header__menu-action"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="site-header__menu-action-icon" aria-hidden>
                      <i className="fa-regular fa-heart" />
                    </span>
                    <span className="site-header__menu-action-label">Wishlist</span>
                    {wishlistItemCount > 0 ? (
                      <span className="site-header__menu-action-badge">
                        {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                      </span>
                    ) : null}
                  </NavLink>
                  <button
                    type="button"
                    className="site-header__menu-action"
                    onClick={() => {
                      setIsMenuOpen(false)
                      openDrawer()
                    }}
                  >
                    <span className="site-header__menu-action-icon" aria-hidden>
                      <i className="fa-solid fa-cart-shopping" />
                    </span>
                    <span className="site-header__menu-action-label">Cart</span>
                    {cartItemCount > 0 ? (
                      <span className="site-header__menu-action-badge">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>

              <div className="site-header__menu-account">
                {isSignedIn ? (
                  <div className="site-header__menu-account-card">
                    <div className="site-header__menu-account-head">
                      <span className="site-header__menu-account-avatar" aria-hidden>
                        <i className="fa-regular fa-user" />
                      </span>
                      <div className="site-header__menu-account-meta">
                        <p className="site-header__menu-account-name">{displayName}</p>
                        {customerEmailLabel ? (
                          <p className="site-header__menu-account-email">{customerEmailLabel}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="site-header__menu-account-links">
                      <NavLink
                        to="/profile"
                        className="site-header__menu-account-link"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fa-regular fa-user" aria-hidden />
                        Profile
                      </NavLink>
                      <NavLink
                        to="/orders"
                        className="site-header__menu-account-link"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fa-solid fa-box" aria-hidden />
                        Orders
                      </NavLink>
                      <button
                        type="button"
                        className="site-header__menu-account-link site-header__menu-account-link--logout"
                        onClick={handleCustomerLogout}
                      >
                        <i className="fa-solid fa-right-from-bracket" aria-hidden />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <NavLink
                    to="/auth"
                    className="site-header__menu-signin"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="fa-regular fa-user" aria-hidden />
                    Sign in / Register
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {searchOpen ? (
        <div className="search-overlay lg:hidden" role="dialog" aria-modal="true" aria-label="Search">
          <div className="flex items-center gap-3 border-b border-[#eadfc9] bg-white px-4 py-3">
            <BrandLogo variant="default" size="compact" className="shrink-0" />
            <form className="relative min-w-0 flex-1" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                autoFocus
                placeholder="Search necklaces, bridal sets, rings…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input-search py-2.5"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a2c3a]"
                aria-label="Search"
              >
                <i className="fa-solid fa-magnifying-glass" aria-hidden />
              </button>
            </form>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="site-header__icon-btn shrink-0"
              aria-label="Close search"
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          </div>
          <div className="section-container py-6">
            {searchText.trim().length >= 2 &&
            (suggestionProducts.length > 0 || suggestionCategories.length > 0) ? (
              <div className="mb-6">
                <SearchSuggestions
                  products={suggestionProducts}
                  categories={suggestionCategories}
                  onSelect={closeSearchUi}
                  className="!static !mt-0 !border-[#eadfc9] !shadow-none"
                />
              </div>
            ) : null}
            {recentSearches.length > 0 ? (
              <>
                <p className="text-kicker">Recent searches</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => runSearch(term)}
                      className="rounded-full border border-[#e3d1b4] bg-white px-4 py-2 font-playfair text-sm text-muted transition hover:border-[#7a2c3a] hover:text-[#7a2c3a]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            <p className={`text-kicker ${recentSearches.length > 0 ? 'mt-6' : ''}`}>Popular searches</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Necklace', 'Bridal Set', 'Earrings', 'Bangles', 'Ring'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => runSearch(term)}
                  className="rounded-full border border-[#e3d1b4] bg-white px-4 py-2 font-playfair text-sm text-muted transition hover:border-[#7a2c3a] hover:text-[#7a2c3a]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default SiteHeader
