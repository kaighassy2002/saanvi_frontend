import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Shown when a guest tries an action that requires a customer session.
 * `redirect` should be a path like `/product/abc` so Auth can return after login.
 */
function LoginPromptModal({ open, onClose, title, description, redirect }) {
  if (!open) return null
  const search = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
    >
      <div className="lux-card relative max-w-md p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted transition hover:text-ink"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
        <h2 id="login-prompt-title" className="pr-8 font-bodoni text-2xl text-ink">
          {title}
        </h2>
        <p className="mt-3 font-playfair text-sm text-muted sm:text-base">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d6c0a2] px-5 py-2.5 font-playfair text-sm text-muted transition hover:bg-[#f7ecee]"
          >
            Cancel
          </button>
          <Link to={`/auth${search}`} className="lux-button text-center text-sm sm:inline-block">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPromptModal
