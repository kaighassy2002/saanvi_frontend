import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { useCart } from '../../hooks/useCart'
import { useCartDrawer } from '../../hooks/useCartDrawer'
import { useWishlist } from '../../hooks/useWishlist'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'
import { formatInr } from '../../services/storefrontConstants'
import { productImageUrl } from '../../utils/cloudinaryImage'
import '../Styles/wishlist-page.css'

function WishlistCard({ product, onAddToCart, onRemove, addingId }) {
  const busy = addingId === product.productId

  return (
    <article className="wishlist-card">
      <div className="wishlist-card__media-wrap">
        <button
          type="button"
          className="wishlist-card__remove"
          onClick={() => onRemove(product.productId)}
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <i className="fa-solid fa-heart" aria-hidden />
        </button>
        <Link to={`/product/${product.productId}`} className="wishlist-card__media-link">
          <img
            src={productImageUrl(product.image, 'card')}
            alt=""
            loading="lazy"
            className="wishlist-card__img"
          />
        </Link>
      </div>

      <div className="wishlist-card__body">
        {product.category ? (
          <p className="wishlist-card__category">{product.category}</p>
        ) : null}
        <Link to={`/product/${product.productId}`} className="wishlist-card__title line-clamp-2">
          {product.name}
        </Link>
        <p className="wishlist-card__price">{formatInr(product.price)}</p>
        <button
          type="button"
          className="wishlist-card__add"
          disabled={busy}
          onClick={() => onAddToCart(product)}
        >
          <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-bag-shopping'}`} aria-hidden />
          {busy ? 'Adding…' : 'Add to bag'}
        </button>
      </div>
    </article>
  )
}

function Wishlist() {
  const { items, remove } = useWishlist()
  const { addItem } = useCart()
  const { openDrawer } = useCartDrawer()
  const signedIn = isCustomerLoggedIn()

  const [toast, setToast] = useState('')
  const [addingId, setAddingId] = useState(null)

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }, [])

  const addProductToCart = useCallback(
    (product) => {
      setAddingId(product.productId)
      addItem({
        productId: product.productId,
        variantName: '',
        variantLabel: '',
        name: product.name,
        image: product.image,
        price: Number(product.price) || 0,
        quantity: 1,
        maxStock: 9999,
      })
      openDrawer()
      showToast(`${product.name} added to your bag`)
      window.setTimeout(() => setAddingId(null), 400)
    },
    [addItem, openDrawer, showToast]
  )

  return (
    <div id="main-content" className="page-shell wishlist-page" tabIndex={-1}>
      <SiteHeader />

      <div className="section-container py-8 sm:py-12">
        <header className="wishlist-page__hero">
          <p className="text-overline">Saved for later</p>
          <h1 className="mt-2 font-bodoni text-3xl text-ink sm:text-4xl">My wishlist</h1>
          <p className="mt-2 max-w-xl text-helper">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} saved`
              : 'Curate pieces you love — they stay here across visits when you sign in.'}
          </p>
        </header>

        {!signedIn && items.length > 0 ? (
          <div className="wishlist-page__sync-banner" role="status">
            <p className="font-playfair text-sm text-ink">
              <i className="fa-regular fa-cloud mr-2 text-gold" aria-hidden />
              Sign in to sync your wishlist across devices.
            </p>
            <Link
              to="/auth?mode=login&redirect=/wishlist"
              className="lux-button shrink-0 px-5 py-2.5 text-sm text-center no-underline"
            >
              Sign in
            </Link>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="wishlist-page__empty">
            <div className="wishlist-page__empty-deco" aria-hidden />
            <div className="wishlist-page__empty-icon">
              <i className="fa-regular fa-heart" aria-hidden />
            </div>
            <h2 className="card-heading relative z-[1]">Your wishlist awaits</h2>
            <p className="relative z-[1] mt-2 max-w-md mx-auto text-helper">
              Tap the heart on any design while you browse — your saved pieces will appear here.
            </p>
            <Link to="/collections" className="lux-button relative z-[1] mt-6 inline-flex">
              Explore collections
            </Link>
            <nav className="wishlist-page__quick-picks relative z-[1]" aria-label="Quick links">
              <Link to="/" className="wishlist-page__chip no-underline">
                New arrivals
              </Link>
              <Link to="/collections" className="wishlist-page__chip no-underline">
                All jewellery
              </Link>
            </nav>
          </div>
        ) : (
          <div className="wishlist-page__cards">
            {items.map((product) => (
              <WishlistCard
                key={product.productId}
                product={product}
                addingId={addingId}
                onAddToCart={addProductToCart}
                onRemove={remove}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={`wishlist-page__toast ${toast ? 'wishlist-page__toast--visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        <i className="fa-solid fa-check text-gold" aria-hidden />
        {toast}
      </div>

      <Footer />
    </div>
  )
}

export default Wishlist
