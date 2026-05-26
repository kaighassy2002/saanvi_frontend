import React from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, Pagination } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import { HOME_HERO_SLIDES } from '../data/homeContent'

function HomeHeroSlider() {
  return (
    <section className="jewelsium-hero relative overflow-hidden">
      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        slidesPerView={1}
        loop
        speed={600}
        autoplay={{ delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation
        pagination={{ clickable: true }}
        className="w-full"
      >
        {HOME_HERO_SLIDES.map((slide, index) => (
          <SwiperSlide key={slide.title}>
            <div className="section-container grid min-h-[min(72vh,520px)] items-center gap-8 py-10 sm:min-h-[420px] sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-16">
              <div className="order-2 text-center lg:order-1 lg:text-left">
                <p className="text-overline">{slide.tag}</p>
                <h1 className="mt-3 font-bodoni text-[clamp(1.75rem,4.5vw,3rem)] leading-tight text-ink">
                  {slide.title}
                </h1>
                <p className="mt-3 text-helper sm:text-base">{slide.subtitle}</p>
                <Link to={slide.link} className="lux-button mt-7 min-h-[44px]">
                  Shop now
                </Link>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative mx-auto aspect-[4/5] max-h-[380px] w-full max-w-md overflow-hidden rounded-2xl border border-[#eadfc9] bg-[var(--color-surface-warm)] sm:max-h-[420px] lg:ml-auto lg:max-w-lg">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-full w-full object-cover object-center"
                    fetchPriority={index === 0 ? 'high' : undefined}
                    loading={index === 0 ? undefined : 'lazy'}
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default HomeHeroSlider
