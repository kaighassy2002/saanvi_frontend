import React from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { useHomeContent } from '../../hooks/useHomeContent'
import { productImageUrl } from '../../utils/cloudinaryImage'

function HomePromoBanners() {
  const ref = useScrollReveal()
  const { promoBanners, homeSections } = useHomeContent()
  const { overline, title } = homeSections.promo || {}

  return (
    <section ref={ref} className="section-container section-reveal py-10 sm:py-14">
      <div className="mb-7 text-center sm:mb-9">
        {overline ? <p className="text-overline">{overline}</p> : null}
        {title ? <h2 className="section-heading mt-2">{title}</h2> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {promoBanners.map((banner, index) => (
          <Link
            key={`${banner.title}-${index}`}
            to={banner.link}
            className="jewelsium-promo group relative flex min-h-[200px] flex-col justify-end overflow-hidden bg-[var(--color-surface-warm)] sm:min-h-[240px]"
          >
            <img
              src={productImageUrl(banner.image, 'promo')}
              alt={banner.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1514]/75 via-[#1f1514]/25 to-transparent" />
            <div className="relative p-5 text-white sm:p-6">
              {banner.label ? (
                <p className="font-playfair text-[10px] uppercase tracking-[0.16em] text-white/90 sm:text-xs">
                  {banner.label}
                </p>
              ) : null}
              <h2 className="mt-1 font-bodoni text-xl font-medium tracking-[0.03em] capitalize text-white sm:text-2xl">
                {banner.title}
              </h2>
              <span className="mt-3 inline-block border-b border-white pb-0.5 font-sans text-xs font-medium uppercase tracking-[0.14em] transition group-hover:border-[#f3d894] group-hover:text-[#f3d894]">
                {banner.buttonText}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomePromoBanners
