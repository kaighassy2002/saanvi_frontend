import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="mt-16 border-t border-[#d9c3a1] bg-[#2a1116] text-[#f9f0e5]">
      <div className="section-container grid gap-10 py-14 lg:grid-cols-4">
        <div>
          <p className="font-bodoni text-2xl tracking-[0.2em] text-gold">SAANVI</p>
          <p className="mt-4 text-helper text-beige-dark">
            Handcrafted jewellery inspired by timeless Indian elegance. Every design is
            curated to celebrate your special moments.
          </p>
          <div className="mt-6 flex gap-3">
            {['facebook-f', 'instagram', 'whatsapp', 'pinterest-p'].map((icon) => (
              <a
                key={icon}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-sm text-[#f9f0e5] transition hover:bg-gold hover:text-ink"
                aria-label={icon}
              >
                <i className={`fab fa-${icon}`}></i>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="card-title tracking-[0.08em] text-gold">Quick Links</h3>
          <ul className="mt-4 space-y-2 text-helper text-beige-dark">
            <li><Link to="/" className="transition hover:text-gold">Home</Link></li>
            <li><Link to="/cart" className="transition hover:text-gold">Cart</Link></li>
            <li><Link to="/orders" className="transition hover:text-gold">Orders</Link></li>
            <li><Link to="/profile" className="transition hover:text-gold">Profile</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="card-title tracking-[0.08em] text-gold">Customer Care</h3>
          <ul className="mt-4 space-y-2 text-helper text-beige-dark">
            <li>Shipping & Delivery</li>
            <li>Returns & Exchanges</li>
            <li>Track Your Order</li>
            <li>FAQs & Support</li>
          </ul>
        </div>

        <div>
          <h3 className="card-title tracking-[0.08em] text-gold">Contact</h3>
          <ul className="mt-4 space-y-3 text-helper text-beige-dark">
            <li><i className="fa-regular fa-envelope mr-2 text-gold"></i> info@saanvi.com</li>
            <li><i className="fa-solid fa-phone mr-2 text-gold"></i> +91 98765 43210</li>
            <li><i className="fa-solid fa-location-dot mr-2 text-gold"></i> Chennai, India</li>
          </ul>
        </div>
      </div>
      <div className="space-y-2 border-t border-gold/20 px-4 py-4 text-center text-sm text-[#ceb9b2]">
        <p>© 2026 SAANVI. All rights reserved.</p>
        <p className="font-playfair text-[#e8d5cc]">
          Made with{' '}
          <i className="fa-solid fa-heart mx-1 text-[#d4728a]" aria-hidden="true" title="love"></i>
          by{' '}
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

