import React from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../Components/Breadcrumbs'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { usePageMeta } from '../../hooks/usePageMeta'
import {
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
  STORE_LOCATION,
  whatsappUrl,
} from '../../services/storefrontConstants'

const LAST_UPDATED = '25 May 2026'
const RETURN_WINDOW_DAYS = 7

function ReturnsPolicy() {
  usePageMeta({
    title: 'Returns & Refunds',
    description: `Returns and refund policy for ${STORE_NAME} — eligibility, timelines, and how to start a return.`,
  })

  return (
    <div className="page-shell">
      <SiteHeader showSearch={false} />

      <article className="section-container py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Returns & Refunds' },
          ]}
        />

        <header className="max-w-3xl">
          <p className="text-overline">Customer care</p>
          <h1 className="mt-2 font-bodoni text-3xl text-ink sm:text-4xl lg:text-5xl">
            Returns &amp; Refunds
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Our policy for returns, exchanges, and refunds on {STORE_NAME} purchases.
          </p>
          <p className="mt-3 font-playfair text-xs text-muted sm:text-sm">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="legal-prose mt-8 max-w-3xl space-y-8 sm:space-y-10">
          <section>
            <h2 className="legal-heading">Return window</h2>
            <p>
              You may request a return within <strong>{RETURN_WINDOW_DAYS} days</strong> of delivery for
              eligible items. The window starts from the date shown on your delivery confirmation.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Eligible items</h2>
            <ul className="legal-list">
              <li>
                Items must be <strong>unworn</strong>, unused, and in original condition with tags and
                packaging intact.
              </li>
              <li>Customised, engraved, or final-sale pieces may not be returnable.</li>
              <li>Damaged or incorrect items received should be reported within 48 hours with photos.</li>
            </ul>
          </section>

          <section>
            <h2 className="legal-heading">How to start a return</h2>
            <p>
              Email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="legal-link">
                {SUPPORT_EMAIL}
              </a>{' '}
              or message us on WhatsApp with your order number, item name, and reason. We will share return
              instructions and the nearest drop-off or pickup option where available.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Refunds</h2>
            <p>
              After we receive and inspect the returned item, approved refunds are processed to your original
              payment method within <strong>5–10 business days</strong>. Bank/UPI timelines may vary by
              provider. COD orders are refunded via UPI or bank transfer once details are verified.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Exchanges</h2>
            <p>
              Exchanges for a different size or design are subject to stock availability. Contact us before
              shipping anything back so we can reserve the replacement where possible.
            </p>
          </section>

          <section>
            <h2 className="legal-heading">Need help?</h2>
            <div className="lux-card mt-4 space-y-4 p-5 sm:p-6">
              <p className="font-bodoni text-lg text-ink">{STORE_NAME} — Returns desk</p>
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
                    href={whatsappUrl('Hi, I would like help with a return or exchange.')}
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
              <div className="flex flex-wrap gap-3">
                <Link to="/orders" className="lux-button inline-flex text-sm">
                  Track orders
                </Link>
                <Link to="/contact" className="button-tertiary inline-flex text-sm">
                  Contact us
                </Link>
              </div>
            </div>
          </section>
        </div>
      </article>

      <Footer />
    </div>
  )
}

export default ReturnsPolicy
