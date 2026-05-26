import React from 'react'
import { Link } from 'react-router-dom'
import { HOME_PROMO_BANNERS } from '../../data/homeContent'

function HomeMobilePromos() {
  return (
    <section className="home-mobile-section" aria-label="Offers">
      <div className="home-mobile-section__head">
        <h2 className="home-mobile-section__title">Offers for you</h2>
        <Link to="/collections" className="home-mobile-section__link">
          See all
        </Link>
      </div>
      <div className="home-mobile-scroll" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        {HOME_PROMO_BANNERS.map((banner) => (
          <Link key={banner.title} to={banner.link} className="home-mobile-promo-card">
            <img src={banner.image} alt="" className="home-mobile-promo-card__img" loading="lazy" />
            <div className="home-mobile-promo-card__shade" aria-hidden />
            <div className="home-mobile-promo-card__body">
              <p className="home-mobile-promo-card__label">{banner.label}</p>
              <p className="home-mobile-promo-card__title">{banner.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeMobilePromos
