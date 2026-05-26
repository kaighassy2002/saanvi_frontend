import React from 'react'
import { Link } from 'react-router-dom'
import { useShopCategories } from '../../hooks/useShopCategories'
import { categoryCollectionHref } from '../data/shopNav'

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="aspect-[4/5] animate-pulse rounded-[1.5rem] bg-[#f4e8db] sm:aspect-auto sm:h-56"
        />
      ))}
    </div>
  )
}

function Category() {
  const { categories, loading } = useShopCategories()

  return (
    <section className="section-container py-14 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="text-overline">Shop by Category</p>
          <h2 className="mt-2 section-heading">Discover Signature Jewellery Types</h2>
          <p className="section-subheading max-w-2xl">
            Browse by style to quickly reach the pieces that match your occasion and mood.
          </p>
        </div>
        <Link to="/collections" className="button-tertiary">
          Browse all products
        </Link>
      </div>

      {loading ? (
        <CategorySkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={categoryCollectionHref(category.name)}
              className="group relative overflow-hidden rounded-[1.5rem] border border-[#e3d2b8] bg-white shadow-[0_18px_40px_-32px_rgba(58,21,29,0.62)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_52px_-30px_rgba(58,21,29,0.7)] focus-visible:ring-2 focus-visible:ring-[#7a2c3a]/35"
            >
              <div className="relative aspect-[4/5] overflow-hidden sm:aspect-auto sm:h-56">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#19090de0] via-[#2d0f1685] to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#f2d7a5]">Category</p>
                  <h3 className="mt-1 font-bodoni text-lg text-[#fff3df] sm:text-2xl">{category.name}</h3>
                  <span className="mt-3 inline-flex items-center gap-2 font-playfair text-sm text-[#f2d7a5]">
                    Shop now
                    <i
                      className="fa-solid fa-arrow-right text-xs transition group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default Category
