import React from 'react'
import { Link } from 'react-router-dom'
import CheckoutSteps from '../Components/CheckoutSteps'
import Footer from '../Components/Footer'
import PageIntro from '../Components/PageIntro'
import SiteHeader from '../Components/SiteHeader'
import { useCart } from '../../hooks/useCart'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'

function Cart() {
  const { items, setQuantity, removeItem, totals } = useCart()

  if (!isCustomerLoggedIn()) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="section-container py-10 sm:py-14">
          <PageIntro
            eyebrow="Secure Cart"
            title="Shopping Cart"
            subtitle="Sign in to review your selected pieces and continue checkout."
          />
          <div className="lux-card mx-auto mt-10 max-w-lg py-14 text-center sm:py-16">
            <i className="fas fa-user-lock mb-6 text-5xl text-[#c9b7a1]"></i>
            <h2 className="card-heading mb-3">Sign in to use your cart</h2>
            <p className="mb-8 px-4 text-sm text-muted sm:text-base">
              Add to cart and checkout are available after you sign in to your account.
            </p>
            <Link to="/auth?redirect=/cart" className="lux-button">
              Sign in
            </Link>
            <p className="mt-4 text-sm text-muted">
              New customer?{' '}
              <Link to="/auth?redirect=/cart" className="text-[#7a2c3a] underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <div className="section-container py-10 sm:py-14">
        <PageIntro
          eyebrow="Refined Checkout"
          title="Shopping Cart"
          subtitle="Review your selected pieces before secure checkout."
          stats={[
            { label: 'Items', value: String(items.length) },
            { label: 'Subtotal', value: `₹${totals.subtotal.toLocaleString()}` },
          ]}
        />
        <CheckoutSteps current="cart" />

        {items.length === 0 ? (
          <div className="lux-card mt-10 py-16 text-center sm:py-20">
            <div className="mb-6 sm:mb-8">
              <i className="fas fa-shopping-cart text-6xl text-[#c9b7a1]"></i>
            </div>
            <h2 className="card-heading mb-3 sm:mb-4">Your cart is empty</h2>
            <p className="mb-6 px-4 text-helper sm:mb-8">Start adding beautiful jewellery to your cart</p>
            <Link to="/collections" className="lux-button">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-4 sm:space-y-6 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="lux-card flex flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6"
                >
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-32 w-full rounded-lg object-cover sm:w-32"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="card-title mb-2">{item.name}</h3>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-price">
                        ₹{item.price.toLocaleString()}
                        <span className="ml-2 text-sm text-muted">each</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.productId, item.quantity - 1, item.maxStock)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c0a2] transition-colors hover:bg-[#f7ecee]"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center font-playfair">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.productId, item.quantity + 1, item.maxStock)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c0a2] transition-colors hover:bg-[#f7ecee]"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 font-playfair text-sm text-muted">
                      Line: ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="self-start p-2 text-[#7a2c3a] transition-colors hover:text-[#5a1f2b] sm:self-center"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <i className="fas fa-trash text-lg"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="lux-card sticky top-24 p-5 sm:p-6">
                <h2 className="card-heading mb-5 sm:mb-6">Order Summary</h2>
                <div className="mb-5 space-y-3 sm:mb-6 sm:space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-playfair">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Shipping</span>
                    <span className="font-playfair">Free</span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="font-playfair text-lg">Total</span>
                    <span className="text-price">₹{totals.total.toLocaleString()}</span>
                  </div>
                </div>
                <Link to="/checkout" className="lux-button block w-full text-center">
                  Proceed to Checkout
                </Link>
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
