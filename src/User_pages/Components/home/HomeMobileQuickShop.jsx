import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../../hooks/useShopCategories'
import { categoryCollectionHref } from '../../data/shopNav'
import { useHomeContent } from '../../../hooks/useHomeContent'
import { applyHomeTemplate } from '../../../services/homeMerchandising'
import { useStoreSettings } from '../../../context/storeSettingsContext'
import { productImageUrl } from '../../../utils/cloudinaryImage'

const MAX_QUICK_CATEGORIES = 5

function HomeMobileQuickShop() {
  const { freeShippingThreshold } = useStoreSettings()
  const { homeSections } = useHomeContent()
  const quickShop = homeSections.mobileQuickShop || {}
  const { categories, loading } = useShopCategories()
  const top = categories.slice(0, MAX_QUICK_CATEGORIES)
  const chips = Array.isArray(quickShop.chips) ? quickShop.chips : []

  return (
    <section className="home-mobile-quick" aria-label="Quick shop">
      {quickShop.searchPlaceholder ? (
        <Link to="/collections" className="home-mobile-quick__search-hint">
          <i className="fa-solid fa-magnifying-glass text-[#9a8578]" aria-hidden />
          {quickShop.searchPlaceholder}
        </Link>
      ) : null}
      <div className="home-mobile-scroll">
        {chips.map((chip, index) => (
          <Link
            key={`chip-${index}-${chip.label}`}
            to={chip.link || '/collections'}
            className={`home-mobile-chip${chip.highlight ? ' home-mobile-chip--gold' : ''}`}
          >
            {chip.highlight ? (
              <i className="fa-solid fa-sparkles text-[10px]" aria-hidden />
            ) : null}
            {applyHomeTemplate(chip.label, { freeShippingThreshold })}
          </Link>
        ))}
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
                  <img
                    src={productImageUrl(cat.image, 'thumb')}
                    alt=""
                    className="home-mobile-chip__thumb"
                    loading="lazy"
                  />
                ) : null}
                {cat.name}
              </Link>
            ))}
      </div>
    </section>
  )
}

export default HomeMobileQuickShop
