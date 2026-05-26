import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../hooks/useShopCategories'
import { categoryCollectionHref } from '../data/shopNav'

function HomePopularCategories() {
  const { categories, loading } = useShopCategories()
  const display = categories.slice(0, 6)

  return (
    <section className="border-t border-[#ebebeb] bg-[#fafafa] py-12 sm:py-16">
      <div className="section-container">
        <h2 className="text-center font-bodoni text-3xl text-[#1f1514] sm:text-4xl">
          Popular Categories
        </h2>

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
                    src={category.image}
                    alt=""
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

        <div className="mt-12 text-center">
          <Link
            to="/collections"
            className="inline-flex min-h-[44px] items-center bg-[#1f1514] px-10 py-3 font-playfair text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#3a151d]"
          >
            Shop all categories
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomePopularCategories
