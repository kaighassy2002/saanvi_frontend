import React from 'react'
import { Link, NavLink } from 'react-router-dom'

function navLinkClass(isActive) {
  return `account-nav__link${isActive ? ' account-nav__link--active' : ''}`
}

function AccountSidebar({ active = 'orders' }) {
  return (
    <aside className="account-card account-card--sidebar hidden lg:block" aria-label="Account navigation">
      <nav>
        <p className="account-sidebar__label">Account</p>
        <ul className="account-nav">
          <li className="account-nav__item">
            <NavLink to="/profile" end className={({ isActive }) => navLinkClass(active === 'profile' || isActive)}>
              <span className="account-nav__icon" aria-hidden>
                <i className="fa-solid fa-user" />
              </span>
              Profile
            </NavLink>
          </li>
          <li className="account-nav__item">
            <Link
              to="/profile?tab=addresses"
              className={navLinkClass(active === 'addresses')}
            >
              <span className="account-nav__icon" aria-hidden>
                <i className="fa-solid fa-location-dot" />
              </span>
              Addresses
            </Link>
          </li>
        </ul>

        <p className="account-sidebar__label">Orders</p>
        <ul className="account-nav">
          <li className="account-nav__item">
            <NavLink to="/orders" end className={({ isActive }) => navLinkClass(active === 'orders' || isActive)}>
              <span className="account-nav__icon" aria-hidden>
                <i className="fa-solid fa-bag-shopping" />
              </span>
              All orders
            </NavLink>
          </li>
        </ul>

        <p className="account-sidebar__label">Shop</p>
        <ul className="account-nav">
          <li className="account-nav__item">
            <Link to="/collections" className="account-nav__link">
              <span className="account-nav__icon" aria-hidden>
                <i className="fa-solid fa-gem" />
              </span>
              Continue shopping
            </Link>
          </li>
          <li className="account-nav__item">
            <Link to="/wishlist" className="account-nav__link">
              <span className="account-nav__icon" aria-hidden>
                <i className="fa-regular fa-heart" />
              </span>
              Wishlist
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default AccountSidebar
