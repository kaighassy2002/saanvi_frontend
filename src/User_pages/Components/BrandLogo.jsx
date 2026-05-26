import React from 'react'
import { Link } from 'react-router-dom'
import { BRAND_LOGO_SRC, STORE_NAME } from '../../services/storefrontConstants'

function BrandLogo({ variant = 'default', size = 'default', className = '' }) {
  const isHero = variant === 'hero'
  const isFooter = variant === 'footer'
  const isCompact = size === 'compact'

  const linkClass = isFooter
    ? `site-footer__brand ${className}`.trim()
    : `site-header__brand ${isHero ? 'site-header__brand--hero' : ''} ${className}`.trim()

  const imgClass = isFooter
    ? 'site-footer__logo-img'
    : `site-header__logo-img${isCompact ? ' site-header__logo-img--compact' : ''}`

  return (
    <Link to="/" className={linkClass} aria-label={`${STORE_NAME} — Home`}>
      <img
        src={BRAND_LOGO_SRC}
        alt={STORE_NAME}
        className={imgClass}
        width={280}
        height={88}
        decoding="async"
        fetchPriority={isFooter ? 'auto' : 'high'}
      />
    </Link>
  )
}

export default BrandLogo
