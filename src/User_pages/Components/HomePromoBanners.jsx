import React from 'react'
import { Link } from 'react-router-dom'
import { HOME_PROMO_BANNERS } from '../data/homeContent'

function HomePromoBanners() {
  return (
    <section className="section-container py-10 sm:py-14">
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {HOME_PROMO_BANNERS.map((banner) => (
          <Link
            key={banner.title}
            to={banner.link}
            className="jewelsium-promo group relative flex min-h-[200px] flex-col justify-end overflow-hidden bg-[var(--color-surface-warm)] sm:min-h-[240px]"
          >
            <img
              src={banner.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1514]/75 via-[#1f1514]/25 to-transparent" />
            <div className="relative p-5 text-white sm:p-6">
              <p className="font-playfair text-[10px] uppercase tracking-[0.16em] text-white/90 sm:text-xs">
                {banner.label}
              </p>
              <h2 className="mt-1 font-bodoni text-xl capitalize sm:text-2xl">{banner.title}</h2>
              <span className="mt-3 inline-block border-b border-white pb-0.5 font-playfair text-xs uppercase tracking-[0.12em] transition group-hover:border-[#f3d894] group-hover:text-[#f3d894]">
                Shop now
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomePromoBanners
