import React from 'react'
import { HOME_SERVICES } from '../../data/homeContent'

function HomeMobileServices() {
  return (
    <section className="home-mobile-services" aria-label="Store benefits">
      <div className="home-mobile-scroll">
        {HOME_SERVICES.map((item) => (
          <div key={item.title} className="home-mobile-service-card">
            <i className={`fa-regular ${item.icon}`} aria-hidden />
            <div>
              <p className="home-mobile-service-card__title">{item.title}</p>
              <p className="home-mobile-service-card__text">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HomeMobileServices
