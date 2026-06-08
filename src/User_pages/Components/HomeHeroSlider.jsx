import React from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import { useHomeHeroSlides } from '../../hooks/useHomeHeroSlides'
import { productImageUrl } from '../../utils/cloudinaryImage'

import 'swiper/css'
import 'swiper/css/pagination'

function HomeHeroSlider() {
  const { slides } = useHomeHeroSlides()

  if (slides.length === 0) return null

  return (
    <section className="jewelsium-hero relative overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={slides.length > 1}
        speed={600}
        autoplay={{ delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        className="w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={`${slide.title}-${index}`}>
            <div className="section-container grid min-h-[min(72vh,520px)] items-center gap-8 py-10 sm:min-h-[420px] sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-16">
              <div className="order-2 text-center lg:order-1 lg:text-left">
                {slide.tag ? <p className="text-overline">{slide.tag}</p> : null}
                <h1
                  className={`font-bodoni text-[clamp(1.75rem,4.5vw,3rem)] leading-tight text-ink ${slide.tag ? 'mt-3' : ''}`}
                >
                  {slide.title}
                </h1>
                {slide.subtitle ? (
                  <p className="mt-3 text-helper sm:text-base">{slide.subtitle}</p>
                ) : null}
                <Link to={slide.link} className="lux-button mt-7 min-h-[44px]">
                  Shop now
                </Link>
              </div>
              <div className="order-1 lg:order-2">
                {slide.image ? (
                  <div className="relative mx-auto aspect-[4/5] max-h-[380px] w-full max-w-md overflow-hidden rounded-2xl border border-[#eadfc9] bg-[var(--color-surface-warm)] sm:max-h-[420px] lg:ml-auto lg:max-w-lg">
                    <img
                      src={productImageUrl(slide.image, 'hero')}
                      alt={slide.title || 'Featured jewellery'}
                      className="h-full w-full object-cover object-center"
                      fetchPriority={index === 0 ? 'high' : undefined}
                      loading={index === 0 ? undefined : 'lazy'}
                      decoding="async"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default HomeHeroSlider
