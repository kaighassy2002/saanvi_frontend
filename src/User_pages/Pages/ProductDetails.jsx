import React, { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import LoginPromptModal from '../Components/LoginPromptModal'
import PageIntro from '../Components/PageIntro'
import SiteHeader from '../Components/SiteHeader'
import { useProduct } from '../../hooks/useProduct'
import { useCart } from '../../hooks/useCart'
import { useWishlist } from '../../hooks/useWishlist'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'

function ProductDetailView({ product }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { addItem } = useCart()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const { toggle, isInWishlist } = useWishlist()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const stock = Math.max(0, Number(product.stock) || 0)
  const inWishlist = isInWishlist(product.id)

  const view = {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    images: product.images?.length ? product.images : [product.image].filter(Boolean),
    description: product.description || 'No description yet.',
    specifications: product.specifications || {
      material: '—',
      weight: '—',
      length: '—',
      certification: '—',
    },
  }

  function handleAddToCart() {
    if (stock <= 0 || view.images.length === 0) return
    if (!isCustomerLoggedIn()) {
      setLoginModalOpen(true)
      return
    }
    const q = Math.min(Math.max(1, quantity), stock)
    addItem({
      productId: product.id,
      name: product.name,
      image: view.images[0],
      price: product.price,
      quantity: q,
      maxStock: stock,
    })
  }

  function handleBuyNow() {
    if (stock <= 0 || view.images.length === 0) return
    if (!isCustomerLoggedIn()) {
      setLoginModalOpen(true)
      return
    }
    const q = Math.min(Math.max(1, quantity), stock)
    addItem({
      productId: product.id,
      name: product.name,
      image: view.images[0],
      price: product.price,
      quantity: q,
      maxStock: stock,
    })
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

  if (view.images.length === 0) return null

  return (
    <div className="page-shell">
      <SiteHeader />

      <div className="section-container py-10 sm:py-14">
        <PageIntro
          eyebrow="Product Spotlight"
          title={view.name}
          subtitle="Discover detailed craftsmanship, premium finishing, and exclusive celebratory styling."
          stats={[
            { label: 'Savings', value: `₹${(view.originalPrice - view.price).toLocaleString()}` },
            { label: 'Stock', value: stock > 0 ? `${stock}` : 'Sold Out' },
          ]}
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="mb-4 mt-8 sm:mb-6">
              <img
                src={view.images[selectedImage]}
                alt={view.name}
                loading="eager"
                fetchPriority="high"
                className="h-80 w-full rounded-2xl border border-[#dcc6a6] object-cover shadow-lg sm:h-96"
              />
            </div>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:mx-0 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
              {view.images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`h-24 w-24 shrink-0 rounded-xl border-2 object-cover ${
                    selectedImage === index
                      ? 'border-gold'
                      : 'border-transparent hover:border-[#d7c2a6]'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${view.name} view ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full rounded-lg object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="mb-4 font-bodoni text-3xl text-ink sm:mb-5 sm:text-4xl md:text-5xl">
                {view.name}
              </h1>
              <div className="mb-5 flex flex-wrap items-center gap-3 sm:mb-6 sm:gap-4">
                <span className="text-price sm:text-3xl">
                  ₹{view.price.toLocaleString()}
                </span>
                <span className="price-strike sm:text-xl">
                  ₹{view.originalPrice.toLocaleString()}
                </span>
                <span className="rounded-full bg-gold px-3 py-1 font-playfair text-xs text-ink sm:text-sm">
                  Save ₹{(view.originalPrice - view.price).toLocaleString()}
                </span>
              </div>
              {stock <= 0 ? (
                <p className="font-playfair text-sm font-semibold text-[#7a2c3a]">Out of stock</p>
              ) : stock <= 5 ? (
                <p className="font-playfair text-sm text-muted">Only {stock} left in stock</p>
              ) : (
                <p className="font-playfair text-sm text-muted">In stock</p>
              )}
            </div>

            <p className="text-sm leading-relaxed text-muted sm:text-base">{view.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e3d1b4] bg-white/80 px-4 py-3 text-sm text-muted">
                <i className="fa-solid fa-certificate mr-2 text-gold" aria-hidden />
                Quality assured craftsmanship
              </div>
              <div className="rounded-xl border border-[#e3d1b4] bg-white/80 px-4 py-3 text-sm text-muted">
                <i className="fa-solid fa-gift mr-2 text-gold" aria-hidden />
                Gift-ready premium packaging
              </div>
            </div>

            <div className="lux-card p-5 sm:p-6">
              <h2 className="card-heading mb-4 sm:mb-5">Specifications</h2>
              <div className="space-y-3 sm:space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Material:</span>
                  <span className="font-playfair">{view.specifications.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Weight:</span>
                  <span className="font-playfair">{view.specifications.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Length:</span>
                  <span className="font-playfair">{view.specifications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Certification:</span>
                  <span className="font-playfair">{view.specifications.certification}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b pb-4">
              <span className="font-playfair text-sm sm:text-base">Quantity:</span>
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={stock <= 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c0a2] transition-colors hover:bg-[#f7ecee] disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-8 text-center font-playfair text-lg sm:text-xl">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={stock <= 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c0a2] transition-colors hover:bg-[#f7ecee] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stock <= 0}
                className="flex-1 rounded-full bg-gold py-3 font-playfair text-base text-ink transition-colors hover:bg-gold-dark disabled:opacity-50 sm:py-4 sm:text-lg"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={stock <= 0}
                className="flex-1 rounded-full bg-ink py-3 font-playfair text-base text-white transition-colors hover:bg-[#2b251d] disabled:opacity-50 sm:py-4 sm:text-lg"
              >
                Buy Now
              </button>
            </div>

            <button
              type="button"
              onClick={handleWishlistToggle}
              className="w-full rounded-full border border-[#d6c0a2] py-3 font-playfair text-sm text-muted transition-colors hover:border-[#7a2c3a] hover:text-[#7a2c3a] sm:text-base"
            >
              <i className={`${inWishlist ? 'fa-solid text-[#7a2c3a]' : 'fa-regular'} fa-heart mr-2`}></i>
              {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
      <LoginPromptModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Sign in to continue"
        description="Please sign in to add items to your cart or buy now. New here? You can create an account in a moment."
        redirect={`${location.pathname}${location.search}`}
      />
      <Footer />
    </div>
  )
}

function ProductDetails() {
  const { id } = useParams()
  const { product: loaded, loading, error } = useProduct(id)

  if (loading) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="section-container py-20 text-center font-playfair text-muted">
          Loading product…
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
          <p className="mt-2 text-muted">{error || 'This item may be unpublished or removed.'}</p>
          <Link to="/collections" className="mt-6 inline-block lux-button">
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
