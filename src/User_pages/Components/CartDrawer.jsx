import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'
import FreeShippingProgress from './FreeShippingProgress'
import { productImageUrl } from '../../utils/cloudinaryImage'

function CartDrawer({ open, onClose }) {
  const { items, setQuantity, removeItem, totals } = useCart()
  const panelRef = useRef(null)
  const signedIn = isCustomerLoggedIn()

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const checkoutTo = signedIn ? '/checkout' : '/auth?redirect=%2Fcheckout'

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[#1f1514]/50"
        aria-label="Close cart"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[#dcc6a6] bg-[#fffdf9] shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-[#eadfc9] px-5 py-4">
          <h2 className="font-bodoni text-xl text-ink">Your bag</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4a7] text-muted"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-helper">Your bag is empty.</p>
              <Link to="/collections" onClick={onClose} className="lux-button mt-4 inline-flex text-sm">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.lineKey} className="flex gap-3 border-b border-[#eadfc9]/80 pb-4">
                  <Link to={`/product/${item.productId}`} onClick={onClose} className="shrink-0">
                    <img
                      src={productImageUrl(item.image, 'thumb')}
                      alt={item.name}
                      className="h-20 w-16 rounded-xl bg-[#f8f2e7] object-contain"
                      loading="lazy"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${item.productId}`}
                      onClick={onClose}
                      className="line-clamp-2 font-sans text-sm font-medium text-ink hover:text-[#7a2c3a]"
                    >
                      {item.name}
                    </Link>
                    <p className="text-price mt-1 text-sm">₹{item.price.toLocaleString()}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-full border border-[#d6c0a2]">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.lineKey, item.quantity - 1, item.maxStock)}
                          className="flex h-8 w-8 items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.lineKey, item.quantity + 1, item.maxStock)}
                          className="flex h-8 w-8 items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineKey)}
                        className="text-xs text-[#7a2c3a] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-[#eadfc9] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <FreeShippingProgress subtotal={totals.subtotal} />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-meta text-sm">Subtotal</span>
              <span className="font-bodoni text-lg text-ink">₹{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-meta text-sm">Shipping</span>
              <span className="font-sans text-sm text-ink">
                {totals.shipping > 0 ? `₹${totals.shipping.toLocaleString()}` : 'Free'}
              </span>
            </div>
            <Link to={checkoutTo} onClick={onClose} className="lux-button mt-4 block w-full text-center">
              {signedIn ? 'Checkout' : 'Continue to checkout'}
            </Link>
            <Link
              to="/cart"
              onClick={onClose}
              className="button-tertiary mt-3 block w-full text-center text-sm"
            >
              View full cart
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  )
}

export default CartDrawer
