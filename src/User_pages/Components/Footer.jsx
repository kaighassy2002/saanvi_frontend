import React from 'react'
import { Link } from 'react-router-dom'
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
  STORE_LOCATION,
  whatsappUrl,
} from '../../services/storefrontConstants'
import BrandLogo from './BrandLogo'
import '../Styles/footer-brand.css'

const paymentIcons = ['cc-visa', 'cc-mastercard', 'google-pay', 'amazon-pay']

function Footer() {
  const whatsappHref = whatsappUrl('Hi, I have a question about Aashmika Designs.')

  return (
    <footer className="mt-12 border-t border-[#d9c3a1] bg-[#2a1116] text-[#f9f0e5] sm:mt-16">
      <div className="section-container grid gap-10 py-12 sm:py-14 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="site-footer__brand-wrap">
            <BrandLogo variant="footer" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-beige-dark">
            Handcrafted jewellery inspired by timeless Indian elegance. Curated for weddings,
            festivals, and everyday grace.
          </p>
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              {paymentIcons.map((icon) => (
                <span
                  key={icon}
                  className="flex h-9 w-11 items-center justify-center rounded-md border border-gold/25 bg-[#3a151d] text-lg text-[#f5ead7]"
                  aria-hidden
                >
                  <i className={`fab fa-${icon}`} />
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-beige-dark/90">COD and UPI on order confirmation — no instant online charge.</p>
          </div>
          <div className="mt-5 flex gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 touch-target items-center justify-center rounded-full border border-gold/40 text-sm transition hover:bg-gold hover:text-ink"
              aria-label="WhatsApp"
            >
              <i className="fab fa-whatsapp" aria-hidden />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-bodoni text-lg tracking-[0.06em] text-gold">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-beige-dark">
            <li>
              <Link to="/collections" className="transition hover:text-gold">
                All collections
              </Link>
            </li>
            <li>
              <Link to="/collections?category=Bridal%20Set" className="transition hover:text-gold">
                Bridal sets
              </Link>
            </li>
            <li>
              <Link to="/collections?category=Necklace" className="transition hover:text-gold">
                Necklaces
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="transition hover:text-gold">
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/cart" className="transition hover:text-gold">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bodoni text-lg tracking-[0.06em] text-gold">Customer care</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-beige-dark">
            <li>
              <Link to="/shipping" className="transition hover:text-gold">
                Shipping &amp; delivery
              </Link>
            </li>
            <li>
              <Link to="/returns" className="transition hover:text-gold">
                Returns &amp; refunds
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition hover:text-gold">
                Contact us
              </Link>
            </li>
            <li>
              <Link to="/orders" className="transition hover:text-gold">
                Track order
              </Link>
            </li>
            <li>
              <Link to="/profile" className="transition hover:text-gold">
                My account
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="transition hover:text-gold">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bodoni text-lg tracking-[0.06em] text-gold">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-beige-dark">
            <li className="flex items-start gap-2">
              <i className="fa-regular fa-envelope mt-0.5 text-gold" aria-hidden />
              <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-gold">
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-phone mt-0.5 text-gold" aria-hidden />
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="transition hover:text-gold">
                {SUPPORT_PHONE}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-location-dot mt-0.5 text-gold" aria-hidden />
              {STORE_LOCATION}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gold/20 px-4 py-5 text-center text-xs text-[#ceb9b2] sm:text-sm">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© 2026 Aashmika Designs. All rights reserved.</span>
          <span className="hidden sm:inline opacity-40" aria-hidden>
            |
          </span>
          <Link to="/shipping" className="text-gold transition hover:underline">
            Shipping
          </Link>
          <span className="opacity-40" aria-hidden>
            |
          </span>
          <Link to="/returns" className="text-gold transition hover:underline">
            Returns
          </Link>
          <span className="opacity-40" aria-hidden>
            |
          </span>
          <Link to="/privacy-policy" className="text-gold transition hover:underline">
            Privacy Policy
          </Link>
        </p>
        <p className="mt-2 font-playfair text-[#e8d5cc]">
          Crafted with care by{' '}
          <a
            href="https://www.kaighassy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold transition hover:underline"
          >
            Kaighassy
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
