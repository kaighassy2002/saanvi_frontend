import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Breadcrumbs from '../Components/Breadcrumbs'
import Footer from '../Components/Footer'
import ProductRecommendations from '../Components/ProductRecommendations'
import ProductReviews from '../Components/ProductReviews'
import SiteHeader from '../Components/SiteHeader'
import TrustStrip from '../Components/TrustStrip'
import { StarRatingCompact } from '../Components/StarRating'
import { useProduct } from '../../hooks/useProduct'
import { useProductReviews } from '../../hooks/useProductReviews'
import { useCart } from '../../hooks/useCart'
import { useCartDrawer } from '../../hooks/useCartDrawer'
import { useWishlist } from '../../hooks/useWishlist'
import { pushRecentlyViewed } from '../../services/recentlyViewed'
import ProductImageGallery from '../Components/ProductImageGallery'
import { getProductImages } from '../utils/productImages'
import '../Styles/product-detail.css'

function formatSpecLabel(key) {
  if (key === 'color') return 'Colour'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function PurchaseBlock({
  stock,
  quantity,
  setQuantity,
  addedFeedback,
  inWishlist,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  className = '',
}) {
  return (
    <div className={`product-detail__purchase ${className}`.trim()}>
      <p className="product-detail__purchase-label">Quantity</p>
      <div className="product-detail__qty-row">
        <div className="product-detail__qty-control">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={stock <= 0}
            className="product-detail__qty-btn rounded-l-full"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="product-detail__qty-value">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            disabled={stock <= 0}
            className="product-detail__qty-btn rounded-r-full"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {stock > 0 ? (
          <span className="font-playfair text-xs text-muted">{stock} available</span>
        ) : null}
      </div>

      <div className="product-detail__actions">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={stock <= 0}
          className="lux-button product-detail__btn-primary w-full disabled:opacity-50 sm:w-auto"
        >
          {addedFeedback ? (
            <>
              <i className="fa-solid fa-check mr-1.5" aria-hidden />
              Added to cart
            </>
          ) : (
            'Add to cart'
          )}
        </button>
        <button
          type="button"
          onClick={onBuyNow}
          disabled={stock <= 0}
          className="product-detail__btn-secondary"
        >
          Buy now
        </button>
        <button
          type="button"
          onClick={onWishlistToggle}
          className={`product-detail__btn-wishlist ${inWishlist ? 'is-active' : ''}`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`${inWishlist ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function ProductDetailView({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { openDrawer } = useCartDrawer()
  const [addedFeedback, setAddedFeedback] = useState(false)
  const { toggle, isInWishlist } = useWishlist()
  const [quantity, setQuantity] = useState(1)

  const stock = Math.max(0, Number(product.stock) || 0)
  const inWishlist = isInWishlist(product.id)
  const reviewsState = useProductReviews(product.id)

  useEffect(() => {
    pushRecentlyViewed(product.id)
  }, [product.id])

  const productImages = getProductImages(product)
  const specs = product.specifications || {}

  const view = {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    category: product.category,
    images: productImages,
    description: product.description || 'Handcrafted piece from the Aashmika Designs collection.',
    specifications: {
      material: specs.material || '',
      color: specs.color || '',
      weight: specs.weight || '',
      length: specs.length || '',
      certification: specs.certification || '',
    },
  }

  const specRows = useMemo(
    () =>
      Object.entries(view.specifications)
        .filter(([, val]) => String(val || '').trim())
        .map(([key, val]) => [formatSpecLabel(key), val]),
    [view.specifications]
  )

  const savings =
    view.originalPrice > view.price ? view.originalPrice - view.price : 0
  const discountPct =
    savings > 0 && view.originalPrice > 0
      ? Math.round((savings / view.originalPrice) * 100)
      : 0

  function addToCartWithQty() {
    if (stock <= 0) return false
    const q = Math.min(Math.max(1, quantity), stock)
    addItem({
      productId: product.id,
      name: product.name,
      image: view.images[0],
      price: product.price,
      quantity: q,
      maxStock: stock,
    })
    setAddedFeedback(true)
    window.setTimeout(() => setAddedFeedback(false), 2500)
    return true
  }

  function handleAddToCart() {
    if (addToCartWithQty()) openDrawer()
  }

  function handleBuyNow() {
    if (stock <= 0) return
    addToCartWithQty()
    navigate('/checkout')
  }

  function handleWishlistToggle() {
    toggle({
      productId: product.id,
      name: product.name,
      image: view.images[0] || product.image,
      price: product.price,
    })
  }

  const purchaseProps = {
    stock,
    quantity,
    setQuantity,
    addedFeedback,
    inWishlist,
    onAddToCart: handleAddToCart,
    onBuyNow: handleBuyNow,
    onWishlistToggle: handleWishlistToggle,
  }

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: 'Collections', to: '/collections' },
    ...(view.category
      ? [{ label: view.category, to: `/collections?category=${encodeURIComponent(view.category)}` }]
      : []),
    { label: view.name },
  ]

  return (
    <div id="main-content" className="page-shell product-detail" tabIndex={-1}>
      <SiteHeader />

      <div className="section-container py-5 sm:py-8 lg:py-10">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="product-detail__grid mt-6 sm:mt-8">
          <ProductImageGallery product={product} discountPct={discountPct} />

          <div className="product-detail__info">
            {view.category ? (
              <Link
                to={`/collections?category=${encodeURIComponent(view.category)}`}
                className="product-detail__category"
              >
                {view.category}
              </Link>
            ) : null}

            <h1 className="product-detail__title">{view.name}</h1>

            {reviewsState.summary.count > 0 ? (
              <StarRatingCompact
                average={reviewsState.summary.average}
                count={reviewsState.summary.count}
              />
            ) : null}

            <div className="product-detail__price-block">
              <div className="product-detail__price-row">
                <span className="product-detail__price">₹{view.price.toLocaleString()}</span>
                {discountPct > 0 ? (
                  <span className="product-detail__discount-badge">{discountPct}% OFF</span>
                ) : null}
                {savings > 0 ? (
                  <>
                    <span className="price-strike text-base">
                      ₹{view.originalPrice.toLocaleString()}
                    </span>
                    <span className="product-detail__save-badge">
                      Save ₹{savings.toLocaleString()}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {stock <= 0 ? (
              <p className="product-detail__stock product-detail__stock--out">Out of stock</p>
            ) : stock <= 5 ? (
              <p className="product-detail__stock product-detail__stock--low">
                <i className="fa-solid fa-fire-flame-curved text-xs" aria-hidden />
                Only {stock} left — order soon
              </p>
            ) : (
              <p className="product-detail__stock product-detail__stock--in">
                <i className="fa-solid fa-circle-check" aria-hidden />
                In stock · Ready to ship
              </p>
            )}

            <PurchaseBlock {...purchaseProps} className="product-detail__purchase--desktop" />

            <TrustStrip className="product-detail__trust" />

            <p className="product-detail__description">{view.description}</p>

            {specRows.length > 0 ? (
              <details className="product-detail__specs" open>
                <summary>Product details</summary>
                <dl>
                  {specRows.map(([label, val]) => (
                    <div key={label} className="product-detail__specs-row">
                      <dt>{label}</dt>
                      <dd>{val}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ) : null}
          </div>
        </div>
      </div>

      <ProductRecommendations currentProduct={view} />

      <ProductReviews productId={view.id} reviewsState={reviewsState} />

      <div className="sticky-buy-bar sticky-buy-bar--with-nav lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-playfair text-[10px] text-muted">Total</p>
            <p className="font-bodoni text-base text-ink">
              ₹{(view.price * quantity).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center rounded-full border border-[#d6c0a2] bg-white">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={stock <= 0}
              className="flex h-8 w-8 items-center justify-center text-sm"
              aria-label="Decrease"
            >
              −
            </button>
            <span className="w-7 text-center text-xs font-playfair">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              disabled={stock <= 0}
              className="flex h-8 w-8 items-center justify-center text-sm"
              aria-label="Increase"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={stock <= 0}
            className="lux-button shrink-0 px-3 py-2 text-xs"
          >
            {addedFeedback ? 'Added' : 'Add'}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={stock <= 0}
            className="shrink-0 rounded-full bg-ink px-3 py-2 font-playfair text-xs text-white disabled:opacity-50"
          >
            Buy now
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function ProductDetails() {
  const { id } = useParams()
  const { product: loaded, loading, error } = useProduct(id)

  if (loading) {
    return (
      <div className="page-shell product-detail">
        <SiteHeader />
        <div className="section-container py-16">
          <div className="product-detail__grid">
            <div className="space-y-3">
              <div className="aspect-square animate-pulse rounded-2xl bg-[#f0e6d6]" />
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-16 animate-pulse rounded-lg bg-[#f0e6d6] sm:h-20 sm:w-20" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-[#f0e6d6]" />
              <div className="h-10 w-1/3 animate-pulse rounded bg-[#f0e6d6]" />
              <div className="h-32 animate-pulse rounded-xl bg-[#f0e6d6]" />
              <div className="h-24 animate-pulse rounded bg-[#f0e6d6]" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !loaded || loaded.published === false) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="section-container py-20 text-center">
          <h1 className="font-bodoni text-3xl text-ink">Product not found</h1>
          <p className="mt-2 text-muted">{error || 'This item may be unavailable.'}</p>
          <Link to="/collections" className="lux-button mt-6 inline-flex">
            Browse collections
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return <ProductDetailView key={id} product={loaded} />
}

export default ProductDetails
