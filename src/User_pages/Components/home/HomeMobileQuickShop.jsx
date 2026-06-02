import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../../hooks/useShopCategories'
import { categoryCollectionHref } from '../../data/shopNav'
import { useStoreSettings } from '../../../context/storeSettingsContext'
import { formatInr } from '../../../services/storefrontConstants'

function HomeMobileQuickShop() {
  const { freeShippingThreshold } = useStoreSettings()
  const { categories, loading } = useShopCategories()
  const top = categories.slice(0, 8)

  return (
    <section className="home-mobile-quick" aria-label="Quick shop">
      <Link to="/collections" className="home-mobile-quick__search-hint">
        <i className="fa-solid fa-magnifying-glass text-[#9a8578]" aria-hidden />
        Search necklaces, rings, bridal sets…
      </Link>
      <div className="home-mobile-scroll">
        <Link to="/collections?sort=latest" className="home-mobile-chip home-mobile-chip--gold">
          <i className="fa-solid fa-sparkles text-[10px]" aria-hidden />
          New arrivals
        </Link>
        <Link to="/collections" className="home-mobile-chip home-mobile-chip--gold">
          Free ship {formatInr(freeShippingThreshold)}+
        </Link>
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <span key={i} className="home-mobile-chip jewelsium-skeleton h-9 w-24 rounded-full" />
            ))
          : top.map((cat) => (
              <Link
                key={cat.name}
                to={categoryCollectionHref(cat.name)}
                className="home-mobile-chip"
              >
                {cat.image ? (
                  <img src={cat.image} alt="" className="home-mobile-chip__thumb" loading="lazy" />
                ) : null}
                {cat.name}
              </Link>
            ))}
      </div>
    </section>
  )
}

export default HomeMobileQuickShop
