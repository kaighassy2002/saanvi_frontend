import React from 'react'
import { useHomeContent } from '../../../hooks/useHomeContent'

function HomeMobileServices() {
  const { homeServices } = useHomeContent()

  return (
    <section className="home-mobile-services" aria-label="Store benefits">
      <div className="home-mobile-scroll">
        {homeServices.map((item, index) => (
          <div key={`${item.title}-${index}`} className="home-mobile-service-card">
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
