import React from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../Components/Breadcrumbs'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import {
  STORE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
  STORE_LOCATION,
  whatsappUrl,
} from '../../services/storefrontConstants'
import '../Styles/contact-page.css'

function ContactCard({ icon, label, hint, href, children, featured, wide, external }) {
  const inner = (
    <>
      <span className="contact-card__icon" aria-hidden>
        <i className={icon} />
      </span>
      <h2 className="contact-card__label">{label}</h2>
      <p className="contact-card__hint">{hint}</p>
      {children}
    </>
  )

  const className = `contact-card${featured ? ' contact-card--featured' : ''}${wide ? ' contact-card--wide' : ''}`

  if (href) {
    const linkProps = external
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {}
    return (
      <a href={href} className={className} {...linkProps}>
        {inner}
      </a>
    )
  }

  return <article className={className}>{inner}</article>
}

function Contact() {
  const whatsappHref = whatsappUrl('Hi, I would like help with Aashmika Designs.')

  return (
    <div className="page-shell">
      <SiteHeader showSearch={false} />

      <div className="contact-page">
        <header className="contact-page__hero">
          <div className="section-container">
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Contact' },
              ]}
            />
            <p className="contact-page__eyebrow mt-4">Customer care</p>
            <h1 className="contact-page__title">We&apos;re here to help</h1>
            <p className="contact-page__subtitle">
              Reach {STORE_NAME} for orders, sizing, shipping, returns, and styling advice. We aim to
              respond within one business day.
            </p>
          </div>
        </header>

        <div className="contact-page__body section-container">
          <div className="contact-page__grid">
            <ContactCard
              icon="fa-regular fa-envelope"
              label="Email"
              hint="Order updates, product questions, and returns"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              <span className="contact-card__action">{SUPPORT_EMAIL}</span>
            </ContactCard>

            <ContactCard
              icon="fa-solid fa-phone"
              label="Phone"
              hint="Mon–Sat, 10:00 AM – 7:00 PM IST"
              href={`tel:${SUPPORT_PHONE_TEL}`}
            >
              <span className="contact-card__action">{SUPPORT_PHONE}</span>
            </ContactCard>

            <ContactCard
              icon="fa-brands fa-whatsapp"
              label="WhatsApp"
              hint="Fastest for order updates and styling tips"
              href={whatsappHref}
              featured
              wide
              external
            >
              <span className="contact-card__action">
                Message on WhatsApp
                <i className="fa-brands fa-whatsapp" aria-hidden />
              </span>
            </ContactCard>

            <ContactCard
              icon="fa-solid fa-location-dot"
              label="Studio"
              hint="Visits by appointment — message us before you travel"
              wide
            >
              <span className="contact-card__action mt-2">{STORE_LOCATION}</span>
            </ContactCard>
          </div>

          <p className="contact-page__hours">
            <strong>Response time:</strong> Most messages are answered within 24 hours on business days.
            For urgent order issues, WhatsApp is recommended.
          </p>

          <div className="contact-page__panel">
            <div>
              <h2 className="contact-page__panel-title">Already placed an order?</h2>
              <p className="contact-page__panel-text">
                Sign in to track status and view your order history. For policy details, see shipping
                and returns below.
              </p>
              <div className="contact-page__links">
                <Link to="/orders" className="contact-page__link">
                  My orders
                </Link>
                <Link to="/auth" className="contact-page__link">
                  Sign in
                </Link>
                <Link to="/shipping" className="contact-page__link">
                  Shipping
                </Link>
                <Link to="/returns" className="contact-page__link">
                  Returns
                </Link>
                <Link to="/privacy-policy" className="contact-page__link">
                  Privacy
                </Link>
              </div>
            </div>
            <Link to="/collections" className="lux-button shrink-0 text-sm py-2.5 px-6">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Contact
