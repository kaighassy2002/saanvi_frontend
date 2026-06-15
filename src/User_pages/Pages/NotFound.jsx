import React from 'react'
import { Link } from 'react-router-dom'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { usePageMeta } from '../../hooks/usePageMeta'

function NotFound() {
  usePageMeta({ title: 'Page not found', noIndex: true })

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-lg px-4 py-16 text-center sm:py-24">
        <p className="font-playfair text-sm uppercase tracking-[0.12em] text-muted">404</p>
        <h1 className="mt-2 font-bodoni text-3xl font-medium text-ink sm:text-4xl">Page not found</h1>
        <p className="mt-3 text-sm text-muted">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="lux-button px-6 py-2.5 text-sm">
            Back to home
          </Link>
          <Link to="/collections" className="lux-button-outline px-6 py-2.5 text-sm">
            Browse collections
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default NotFound
