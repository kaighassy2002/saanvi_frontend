import React from 'react'
import { Link } from 'react-router-dom'
import { useStoreSettings } from '../../context/storeSettingsContext'
import { formatInr } from '../../services/storefrontConstants'

function AnnouncementBar({ variant = 'default' }) {
  const { freeShippingThreshold, announcementMessage } = useStoreSettings()
  const isHero = variant === 'hero'

  const message =
    String(announcementMessage || '').trim() ||
    `Free shipping on orders above ${formatInr(freeShippingThreshold)}`

  const showShopLink = !String(announcementMessage || '').trim()

  return (
    <div
      className={
        isHero
          ? 'border-b border-[#f2d9ab33] bg-[#14090ce6] text-center backdrop-blur-sm'
          : 'border-b border-[#eadfc9] bg-[#2a1116] text-center'
      }
    >
      <p
        className={`px-4 py-2 font-sans text-xs font-medium tracking-wide sm:text-sm ${
          isHero ? 'text-[#f2dfbf]' : 'text-[#f5ead7]'
        }`}
      >
        {!showShopLink ? (
          message
        ) : (
          <>
            <i className="fa-solid fa-truck-fast mr-1.5 text-gold" aria-hidden />
            {message}
            <span className="mx-2 opacity-40" aria-hidden>
              |
            </span>
            <Link
              to="/collections"
              className={`underline-offset-2 transition hover:underline ${
                isHero ? 'text-gold hover:text-[#fff4e6]' : 'text-gold hover:text-white'
              }`}
            >
              Shop now
            </Link>
          </>
        )}
      </p>
    </div>
  )
}

export default AnnouncementBar
