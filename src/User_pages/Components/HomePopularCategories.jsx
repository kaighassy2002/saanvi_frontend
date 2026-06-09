import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../hooks/useShopCategories'
import { useHomeContent } from '../../hooks/useHomeContent'
import { categoryCollectionHref } from '../data/shopNav'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { productImageUrl } from '../../utils/cloudinaryImage'

function HomePopularCategories() {
  const ref = useScrollReveal()
  const { categories, loading } = useShopCategories()
  const { homeSections } = useHomeContent()
  const copy = homeSections.categories || {}
  const display = categories.slice(0, 6)

  return (
    <section ref={ref} className="section-reveal border-t border-[#ebebeb] bg-[#fafafa] py-12 sm:py-16">
      <div className="section-container">
        {copy.overline ? <p className="text-overline text-center">{copy.overline}</p> : null}
        {copy.title ? (
          <h2 className="section-heading mt-2 text-center">{copy.title}</h2>
        ) : null}

        {loading ? (
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="jewelsium-skeleton h-[7.5rem] w-[7.5rem] rounded-full sm:h-[8.5rem] sm:w-[8.5rem]" />
                <div className="jewelsium-skeleton h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-10 sm:gap-x-10">
            {display.map((category) => (
              <Link
                key={category.name}
                to={categoryCollectionHref(category.name)}
                className="group flex w-[7.5rem] flex-col items-center sm:w-[8.5rem]"
              >
                <div className="jewelsium-category-circle">
                  <img
                    src={productImageUrl(category.image, 'category')}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <span className="mt-3 text-center font-sans text-sm text-muted transition group-hover:text-royal-700">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {copy.buttonLabel ? (
          <div className="mt-12 text-center">
            <Link
              to={copy.buttonLink || '/collections'}
              className="inline-flex min-h-[44px] items-center bg-[#1f1514] px-10 py-3 font-sans text-xs font-medium uppercase tracking-[0.14em] text-white transition hover:bg-[#3a151d]"
            >
              {copy.buttonLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default HomePopularCategories
