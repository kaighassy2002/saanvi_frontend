import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../../hooks/useShopCategories'
import { categoryCollectionHref } from '../../data/shopNav'

function HomeMobileCategories() {
  const { categories, loading } = useShopCategories()
  const display = categories.slice(0, 10)

  return (
    <section className="home-mobile-section pb-2" aria-label="Shop by category">
      <div className="home-mobile-section__head">
        <h2 className="home-mobile-section__title">Shop by category</h2>
        <Link to="/collections" className="home-mobile-section__link">
          All
        </Link>
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
                    src={category.image}
                    alt=""
                    className="home-mobile-cat-card__img"
                    loading="lazy"
                  />
                </div>
                <span className="home-mobile-cat-card__name">{category.name}</span>
              </Link>
            ))}
      </div>

      <div className="home-mobile-cta">
        <h3 className="home-mobile-cta__title">Discover handcrafted jewellery</h3>
        <p className="home-mobile-cta__text">Bridal, festive, and everyday pieces curated for you.</p>
        <Link to="/collections" className="home-mobile-cta__btn">
          Explore collections
        </Link>
      </div>
    </section>
  )
}

export default HomeMobileCategories
