import React from 'react'
import { Link } from 'react-router-dom'
import { formatInr, FREE_SHIPPING_THRESHOLD } from '../../services/storefrontConstants'

function AnnouncementBar({ variant = 'default' }) {
  const isHero = variant === 'hero'
  return (
    <div
      className={
        isHero
          ? 'border-b border-[#f2d9ab33] bg-[#14090ce6] text-center backdrop-blur-sm'
          : 'border-b border-[#eadfc9] bg-[#2a1116] text-center'
      }
    >
      <p
        className={`px-4 py-2 font-playfair text-[11px] tracking-[0.06em] sm:text-xs ${
          isHero ? 'text-[#f2dfbf]' : 'text-[#f5ead7]'
        }`}
      >
        <i className="fa-solid fa-truck-fast mr-1.5 text-gold" aria-hidden />
        Free shipping on orders above {formatInr(FREE_SHIPPING_THRESHOLD)}
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
      </p>
    </div>
  )
}

export default AnnouncementBar
