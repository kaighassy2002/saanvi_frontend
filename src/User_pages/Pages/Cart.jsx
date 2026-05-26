import React from 'react'
import { Link } from 'react-router-dom'
import CheckoutSteps from '../Components/CheckoutSteps'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import TrustStrip from '../Components/TrustStrip'
import FreeShippingProgress from '../Components/FreeShippingProgress'
import { useCart } from '../../hooks/useCart'
import { whatsappUrl } from '../../services/storefrontConstants'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'

function Cart() {
  const { items, setQuantity, removeItem, totals } = useCart()
  const signedIn = isCustomerLoggedIn()

  return (
    <div id="main-content" className="page-shell" tabIndex={-1}>
      <SiteHeader />

      <div className="section-container py-8 sm:py-12">
        <p className="text-overline">Your bag</p>
        <h1 className="mt-2 font-bodoni text-3xl text-ink sm:text-4xl">Shopping cart</h1>
        <p className="mt-2 text-helper">
          {items.length > 0
            ? `${items.length} ${items.length === 1 ? 'item' : 'items'} · Subtotal ₹${totals.subtotal.toLocaleString()}`
            : 'Your selected pieces appear here.'}
        </p>

        <CheckoutSteps current="cart" />

        {!signedIn && items.length > 0 ? (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e3d1b4] bg-[#fff6eb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-playfair text-sm text-ink">
              <i className="fa-regular fa-user mr-2 text-gold" aria-hidden />
              Continue to checkout — you&apos;ll sign in on the next step. Your cart is saved on this device.
            </p>
            <Link to="/checkout" className="lux-button shrink-0 px-5 py-2.5 text-sm">
              Continue to checkout
            </Link>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="lux-card mt-8 py-14 text-center sm:py-20">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ead7] text-2xl text-[#7a2c3a]">
              <i className="fa-solid fa-cart-shopping" aria-hidden />
            </div>
            <h2 className="card-heading">Your cart is empty</h2>
            <p className="mt-2 px-4 text-helper">Explore our collections and add pieces you love.</p>
            <Link to="/collections" className="lux-button mt-6 inline-flex">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="lux-card flex gap-4 p-4 sm:gap-5 sm:p-5"
                >
                  <Link to={`/product/${item.productId}`} className="shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${item.productId}`}
                      className="card-title line-clamp-2 hover:text-[#7a2c3a]"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-price text-lg">₹{item.price.toLocaleString()}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-[#d6c0a2]">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.productId, item.quantity - 1, item.maxStock)
                          }
                          className="touch-target flex h-10 w-10 items-center justify-center rounded-l-full hover:bg-[#f7ecee]"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[2.5rem] text-center font-playfair text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.productId, item.quantity + 1, item.maxStock)
                          }
                          className="touch-target flex h-10 w-10 items-center justify-center rounded-r-full hover:bg-[#f7ecee]"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-playfair text-sm font-medium text-ink">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="touch-target shrink-0 self-start p-2 text-[#7a2c3a]"
                    aria-label={`Remove ${item.name}`}
                  >
                    <i className="fa-solid fa-trash text-sm" aria-hidden />
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="lux-card sticky top-24 space-y-5 p-5 sm:p-6">
                <FreeShippingProgress subtotal={totals.subtotal} />
                <h2 className="card-heading">Order summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-playfair text-ink">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Shipping</span>
                    <span className="font-playfair text-success">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-[#eadfc9] pt-3">
                    <span className="font-playfair text-lg text-ink">Total</span>
                    <span className="text-price">₹{totals.total.toLocaleString()}</span>
                  </div>
                </div>
                {signedIn ? (
                  <Link to="/checkout" className="lux-button block w-full text-center">
                    Proceed to checkout
                  </Link>
                ) : (
                  <>
                    <Link to="/checkout" className="lux-button block w-full text-center">
                      Continue to checkout
                    </Link>
                    <p className="text-center font-playfair text-xs text-muted">
                      Sign in on the next step to complete your order.
                    </p>
                  </>
                )}
                <Link to="/collections" className="block text-center font-playfair text-sm text-muted hover:text-[#7a2c3a]">
                  Continue shopping
                </Link>
                <a
                  href={whatsappUrl('Hi, I have a question about my cart order.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center font-playfair text-sm text-[#7a2c3a] hover:underline"
                >
                  <i className="fa-brands fa-whatsapp mr-1" aria-hidden />
                  Questions? Chat on WhatsApp
                </a>
                <TrustStrip
                  items={[
                    { icon: 'fa-shield-halved', label: 'Secure' },
                    { icon: 'fa-truck-fast', label: 'Fast ship' },
                  ]}
                  className="!grid-cols-2 !gap-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Cart
