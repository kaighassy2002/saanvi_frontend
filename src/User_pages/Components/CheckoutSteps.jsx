import React from 'react'

const STEP_ORDER = ['cart', 'checkout', 'complete']

const STEP_META = {
  cart: { label: 'Cart', icon: 'fa-cart-shopping' },
  checkout: { label: 'Checkout', icon: 'fa-credit-card' },
  complete: { label: 'Complete', icon: 'fa-circle-check' },
}

function CheckoutSteps({ current = 'cart' }) {
  const currentIndex = Math.max(STEP_ORDER.indexOf(current), 0)

  return (
    <div className="mb-8 mt-6 rounded-2xl border border-[#e3d1b4] bg-white/80 p-4 shadow-[0_20px_45px_-40px_rgba(58,21,29,0.8)] sm:mb-10 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {STEP_ORDER.map((step, index) => {
          const meta = STEP_META[step]
          const isActive = index === currentIndex
          const isDone = index < currentIndex

          return (
            <div key={step} className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm transition-colors ${
                  isActive || isDone
                    ? 'border-gold bg-gold text-ink'
                    : 'border-[#dcc6a6] bg-[#fff8ef] text-muted'
                }`}
              >
                <i className={`fa-solid ${meta.icon}`} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-kicker">Step {index + 1}</p>
                <p className={`font-playfair text-sm sm:text-base ${isActive ? 'text-ink' : 'text-muted'}`}>
                  {meta.label}
                </p>
              </div>
              {index < STEP_ORDER.length - 1 ? (
                <div className="ml-auto hidden h-px flex-1 bg-[#e8d8bf] sm:block" />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CheckoutSteps
