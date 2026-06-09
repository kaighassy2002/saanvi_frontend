import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../../hooks/useShopCategories'
import { useHomeContent } from '../../../hooks/useHomeContent'
import { categoryCollectionHref } from '../../data/shopNav'
import { productImageUrl } from '../../../utils/cloudinaryImage'

function HomeMobileCategories() {
  const { categories, loading } = useShopCategories()
  const { homeSections } = useHomeContent()
  const copy = homeSections.mobileCategories || {}
  const display = categories.slice(0, 10)

  return (
    <section className="home-mobile-section pb-2" aria-label="Shop by category">
      <div className="home-mobile-section__head">
        {copy.title ? <h2 className="home-mobile-section__title">{copy.title}</h2> : null}
        {copy.linkLabel ? (
          <Link to={copy.linkUrl || '/collections'} className="home-mobile-section__link">
            {copy.linkLabel}
          </Link>
        ) : null}
      </div>

      <div className="home-mobile-scroll">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="home-mobile-cat-card">
                <div className="home-mobile-cat-card__img-wrap jewelsium-skeleton" />
                <span className="home-mobile-cat-card__name jewelsium-skeleton mt-2 inline-block h-3 w-12" />
              </div>
            ))
          : display.map((category) => (
              <Link
                key={category.name}
                to={categoryCollectionHref(category.name)}
                className="home-mobile-cat-card"
              >
                <div className="home-mobile-cat-card__img-wrap">
                  <img
                    src={productImageUrl(category.image, 'category')}
                    alt=""
                    className="home-mobile-cat-card__img"
                    loading="lazy"
                  />
                </div>
                <span className="home-mobile-cat-card__name">{category.name}</span>
              </Link>
            ))}
      </div>

      {copy.ctaTitle || copy.ctaText || copy.ctaButtonLabel ? (
        <div className="home-mobile-cta">
          {copy.ctaTitle ? <h3 className="home-mobile-cta__title">{copy.ctaTitle}</h3> : null}
          {copy.ctaText ? <p className="home-mobile-cta__text">{copy.ctaText}</p> : null}
          {copy.ctaButtonLabel ? (
            <Link to={copy.ctaButtonLink || '/collections'} className="home-mobile-cta__btn">
              {copy.ctaButtonLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default HomeMobileCategories
