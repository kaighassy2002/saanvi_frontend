import React from 'react'
import { Link } from 'react-router-dom'
import { useStoreSettings } from '../../context/storeSettingsContext'
import { resolveAnnouncementBar } from '../../services/announcementBar'

function AnnouncementLink({ to, className, children, isHero }) {
  const href = String(to || '/collections').trim() || '/collections'
  const linkClass = `underline-offset-2 transition hover:underline ${
    isHero ? 'text-gold hover:text-[#fff4e6]' : 'text-gold hover:text-white'
  } ${className || ''}`.trim()

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={linkClass}>
        {children}
      </a>
    )
  }

  return (
    <Link to={href.startsWith('/') ? href : `/${href}`} className={linkClass}>
      {children}
    </Link>
  )
}

function AnnouncementBar({ variant = 'default' }) {
  const settings = useStoreSettings()
  const isHero = variant === 'hero'
  const bar = resolveAnnouncementBar(settings)

  if (!bar.enabled) return null

  const { extraMessage, message, linkLabel, linkUrl, showIcon } = bar

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
        {extraMessage ? (
          <>
            <span className={isHero ? 'text-gold' : 'text-gold'}>{extraMessage}</span>
            <span className="mx-2 opacity-40" aria-hidden>
              ·
            </span>
          </>
        ) : null}
        {showIcon ? <i className="fa-solid fa-truck-fast mr-1.5 text-gold" aria-hidden /> : null}
        {message}
        {linkLabel ? (
          <>
            <span className="mx-2 opacity-40" aria-hidden>
              |
            </span>
            <AnnouncementLink to={linkUrl} isHero={isHero}>
              {linkLabel}
            </AnnouncementLink>
          </>
        ) : null}
      </p>
    </div>
  )
}

export default AnnouncementBar
