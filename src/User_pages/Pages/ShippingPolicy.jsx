import React from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../Components/Breadcrumbs'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { useStoreSettings } from '../../context/storeSettingsContext'
import {
  formatInr,
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
  STORE_LOCATION,
  whatsappUrl,
} from '../../services/storefrontConstants'

const LAST_UPDATED = '25 May 2026'

function ShippingPolicy() {
  const { freeShippingThreshold, shippingFee } = useStoreSettings()

  return (
    <div className="page-shell">
      <SiteHeader showSearch={false} />

      <article className="section-container py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Shipping & Delivery' },
          ]}
        />

        <header className="max-w-3xl">
          <p className="text-overline">Customer care</p>
          <h1 className="mt-2 font-bodoni text-3xl text-ink sm:text-4xl lg:text-5xl">
            Shipping &amp; Delivery
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            How {STORE_NAME} processes, packs, and delivers your orders across India.
          </p>
          <p className="mt-3 font-playfair text-xs text-muted sm:text-sm">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="legal-prose mt-8 max-w-3xl space-y-8 sm:space-y-10">
          <section>
            <h2 className="legal-heading">Order processing</h2>
            <p>
              Most in-stock pieces are prepared for dispatch within <strong>48 hours</strong> of order
              confirmation (excluding public holidays). Custom or made-to-order items may take longer;
              we will contact you if your order needs extra time.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Delivery areas</h2>
            <p>
              We currently ship to serviceable pin codes across India via our courier partners. Remote or
              restricted locations may require additional transit time or alternate arrangements.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Shipping charges</h2>
            <p>
              Standard delivery is <strong>free</strong> on orders above{' '}
              {formatInr(freeShippingThreshold)}. Below that threshold, a flat shipping fee of{' '}
              {shippingFee > 0 ? formatInr(shippingFee) : 'no extra charge'} applies and is shown at
              checkout before you confirm payment.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Cash on delivery (COD)</h2>
            <p>
              COD may be available at checkout for eligible orders and pin codes. The full payable amount
              is collected at delivery. Please keep your phone reachable for courier updates.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Tracking your order</h2>
            <p>
              After dispatch, tracking details are shared by email/SMS where available. You can also view
              order status when signed in under{' '}
              <Link to="/orders" className="legal-link">
                My orders
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Questions?</h2>
            <div className="lux-card mt-4 space-y-4 p-5 sm:p-6">
              <p className="font-bodoni text-lg text-ink">{STORE_NAME} — Shipping support</p>
              <ul className="space-y-3 text-sm text-muted sm:text-base">
                <li className="flex items-start gap-3">
                  <i className="fa-regular fa-envelope mt-1 text-gold" aria-hidden />
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="legal-link">
                    {SUPPORT_EMAIL}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-phone mt-1 text-gold" aria-hidden />
                  <a href={`tel:${SUPPORT_PHONE_TEL}`} className="legal-link">
                    {SUPPORT_PHONE}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-brands fa-whatsapp mt-1 text-gold" aria-hidden />
                  <a
                    href={whatsappUrl('Hi, I have a question about shipping my order.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="legal-link"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-location-dot mt-1 text-gold" aria-hidden />
                  <span>{STORE_LOCATION}</span>
                </li>
              </ul>
              <Link to="/contact" className="button-tertiary inline-flex text-sm">
                Contact page
              </Link>
            </div>
          </section>
        </div>
      </article>

      <Footer />
    </div>
  )
}

export default ShippingPolicy
