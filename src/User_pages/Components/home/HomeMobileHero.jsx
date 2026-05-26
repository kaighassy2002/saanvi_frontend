import React from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import { HOME_HERO_SLIDES } from '../../data/homeContent'

import 'swiper/css'
import 'swiper/css/pagination'

function HomeMobileHero() {
  return (
    <section className="home-mobile-hero" aria-label="Featured collections">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop
        speed={500}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="w-full"
      >
        {HOME_HERO_SLIDES.map((slide, index) => (
          <SwiperSlide key={slide.title}>
            <div className="home-mobile-hero__slide">
              <img
                src={slide.image}
                alt=""
                className="home-mobile-hero__img"
                fetchPriority={index === 0 ? 'high' : undefined}
                loading={index === 0 ? undefined : 'lazy'}
                decoding="async"
              />
              <div className="home-mobile-hero__overlay" aria-hidden />
              <div className="home-mobile-hero__content">
                <p className="home-mobile-hero__tag">{slide.tag}</p>
                <h1 className="home-mobile-hero__title">{slide.title}</h1>
                <p className="home-mobile-hero__sub">{slide.subtitle}</p>
                <Link to={slide.link} className="home-mobile-hero__cta">
                  Shop now
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default HomeMobileHero
