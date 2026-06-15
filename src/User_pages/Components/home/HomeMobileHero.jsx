import React from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import { useHomeHeroSlides } from '../../../hooks/useHomeHeroSlides'
import { productImageUrl } from '../../../utils/cloudinaryImage'

import 'swiper/css'
import 'swiper/css/pagination'

function HomeMobileHero() {
  const { slides, ready } = useHomeHeroSlides()

  if (!ready && slides.length === 0) {
    return (
      <section className="home-mobile-hero home-mobile-hero--loading" aria-hidden="true">
        <div className="home-mobile-hero__slide jewelsium-skeleton" />
      </section>
    )
  }

  if (slides.length === 0) return null

  return (
    <section className="home-mobile-hero" aria-label="Featured collections">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={slides.length > 1}
        speed={500}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        className="w-full"
      >
        {slides.map((slide, index) => {
          const TitleTag = index === 0 ? 'h1' : 'h2'
          return (
            <SwiperSlide key={`${slide.title}-${index}`}>
              <div className="home-mobile-hero__slide">
                {slide.image ? (
                  <img
                    src={productImageUrl(slide.image, 'hero')}
                    alt={slide.title || 'Featured jewellery'}
                    className="home-mobile-hero__img"
                    fetchPriority={index === 0 ? 'high' : undefined}
                    loading={index === 0 ? undefined : 'lazy'}
                    decoding="async"
                  />
                ) : null}
                <div className="home-mobile-hero__overlay" aria-hidden />
                <div className="home-mobile-hero__content">
                  {slide.tag ? <p className="home-mobile-hero__tag">{slide.tag}</p> : null}
                  <TitleTag className="home-mobile-hero__title">{slide.title}</TitleTag>
                  {slide.subtitle ? <p className="home-mobile-hero__sub">{slide.subtitle}</p> : null}
                  <Link to={slide.link} className="home-mobile-hero__cta">
                    Shop now
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </section>
  )
}

export default HomeMobileHero
