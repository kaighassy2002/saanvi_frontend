import React, { useMemo } from 'react'
import { useStoreSettings } from '../../../context/storeSettingsContext'
import { formatInr } from '../../../services/storefrontConstants'
import { HOME_SERVICES } from '../../data/homeContent'

function HomeMobileServices() {
  const { freeShippingThreshold } = useStoreSettings()
  const services = useMemo(
    () =>
      HOME_SERVICES.map((item) =>
        item.title === 'Free Shipping'
          ? { ...item, text: `Orders over ${formatInr(freeShippingThreshold)}` }
          : item
      ),
    [freeShippingThreshold]
  )

  return (
    <section className="home-mobile-services" aria-label="Store benefits">
      <div className="home-mobile-scroll">
        {services.map((item) => (
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
