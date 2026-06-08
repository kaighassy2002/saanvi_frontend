import React from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import { useNewArrivals } from '../../hooks/useNewArrivals'
import ProductCardMedia from './ProductCardMedia'

import 'swiper/css'
import 'swiper/css/pagination'

function NewArrivals() {
  const { products: newArrivals, loading } = useNewArrivals()

  if (loading && newArrivals.length === 0) {
    return (
      <section className="section-container pb-16 pt-12 sm:pt-16">
        <p className="text-helper text-center">Loading new arrivals…</p>
      </section>
    )
  }

  return (
    <section className="section-container pb-16 pt-10 sm:pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-overline">New Arrivals</p>
          <h2 className="section-heading mt-2">Fresh Picks For This Week</h2>
          <p className="mt-3 max-w-2xl text-helper">
            Newly added pieces curated for festive styling and everyday elegance.
          </p>
        </div>
        <Link to="/collections" className="button-tertiary">
          View all collections
        </Link>
      </div>

      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        spaceBetween={16}
        speed={550}
        style={{
          '--swiper-pagination-color': '#d4af37',
          '--swiper-pagination-bullet-inactive-color': '#d8cdb9',
          '--swiper-pagination-bullet-inactive-opacity': '1',
        }}
        grabCursor
        pagination={{
          clickable: true,
          dynamicBullets: true,
          dynamicMainBullets: 5,
        }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          480: { slidesPerView: 1.12, spaceBetween: 16 },
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 22 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="new-arrivals-swiper__root mt-10"
      >
        {newArrivals.map((product) => (
          <SwiperSlide key={product.id}>
            <Link
              to={`/product/${product.id}`}
              className="group block h-full overflow-hidden rounded-[1.6rem] border border-[#e8d7bf] bg-[linear-gradient(180deg,#fffdfa_0%,#fff8ee_100%)] shadow-[0_18px_38px_-30px_rgba(58,21,29,0.52)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_45px_-30px_rgba(58,21,29,0.65)]"
            >
              <div className="relative mx-3 mt-3 aspect-[4/5] w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl bg-[#f8f2e7]">
                <ProductCardMedia
                  product={product}
                  alt={product.name}
                  imageClassName="store-product-card__media-img p-4 transition duration-700 ease-out group-hover:scale-105"
                />

                {product.discount > 0 ? (
                  <span className="absolute left-3 top-3 rounded-full bg-[#7a2c3a] px-3 py-1 font-playfair text-xs font-semibold text-white shadow-md">
                    {product.discount}% OFF
                  </span>
                ) : null}

                <span className="absolute bottom-3 right-3 rounded-full border border-[#e9d7bc] bg-white/95 px-3 py-1 font-playfair text-[11px] uppercase tracking-[0.08em] text-[#7b5f3d]">
                  {product.category || 'Jewellery'}
                </span>
              </div>

              <div className="space-y-2 px-5 pb-5 pt-4">
                <h3 className="font-bodoni text-xl text-ink transition group-hover:text-[#7a2c3a]">
                  {product.name}
                </h3>

                <div className="flex items-center gap-3">
                  <span className="text-price font-semibold text-[#b78439]">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <span className="price-strike text-sm">₹{product.originalPrice.toLocaleString()}</span>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 font-playfair text-sm text-[#7a2c3a]">
                    Explore details
                    <i className="fa-solid fa-arrow-right text-xs transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default NewArrivals
