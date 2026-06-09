import React from 'react'
import { Link } from 'react-router-dom'
import { useHomeContent } from '../../../hooks/useHomeContent'
import { productImageUrl } from '../../../utils/cloudinaryImage'

function HomeMobilePromos() {
  const { promoBanners, homeSections } = useHomeContent()
  const copy = homeSections.mobilePromos || {}

  return (
    <section className="home-mobile-section" aria-label="Offers">
      <div className="home-mobile-section__head">
        {copy.title ? <h2 className="home-mobile-section__title">{copy.title}</h2> : null}
        {copy.linkLabel ? (
          <Link to={copy.linkUrl || '/collections'} className="home-mobile-section__link">
            {copy.linkLabel}
          </Link>
        ) : null}
      </div>
      <div className="home-mobile-scroll" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        {promoBanners.map((banner, index) => (
          <Link key={`${banner.title}-${index}`} to={banner.link} className="home-mobile-promo-card">
            <img
              src={productImageUrl(banner.image, 'promo')}
              alt=""
              className="home-mobile-promo-card__img"
              loading="lazy"
            />
            <div className="home-mobile-promo-card__shade" aria-hidden />
            <div className="home-mobile-promo-card__body">
              {banner.label ? <p className="home-mobile-promo-card__label">{banner.label}</p> : null}
              <p className="home-mobile-promo-card__title">{banner.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeMobilePromos
