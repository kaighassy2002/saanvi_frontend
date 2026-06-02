import React from 'react'
import { Link } from 'react-router-dom'
import { useStoreSettings } from '../../context/storeSettingsContext'
import { formatInr } from '../../services/storefrontConstants'

function FreeShippingProgress({ subtotal }) {
  const { freeShippingThreshold } = useStoreSettings()

  if (subtotal <= 0) return null

  const qualified = subtotal >= freeShippingThreshold
  const remaining = Math.max(0, freeShippingThreshold - subtotal)
  const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))

  return (
    <div className="rounded-xl border border-[#e3d1b4] bg-[#fff6eb] px-4 py-3">
      <p className="font-playfair text-sm text-ink">
        {qualified ? (
          <>
            <i className="fa-solid fa-circle-check mr-1.5 text-success" aria-hidden />
            You qualify for <strong>free shipping</strong>!
          </>
        ) : (
          <>
            Add <strong>{formatInr(remaining)}</strong> more for free shipping on orders above{' '}
            {formatInr(freeShippingThreshold)}.
          </>
        )}
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#eadfc9]"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={qualified ? 'Free shipping unlocked' : 'Progress toward free shipping'}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#d8b160,#c9a34a)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {!qualified ? (
        <Link to="/collections" className="mt-2 inline-block font-playfair text-xs text-[#7a2c3a] hover:underline">
          Continue shopping
        </Link>
      ) : null}
    </div>
  )
}

export default FreeShippingProgress
