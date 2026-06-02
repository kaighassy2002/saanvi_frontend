import React, { useMemo } from 'react'

import { useStoreSettings } from '../../context/storeSettingsContext'
import { formatInr } from '../../services/storefrontConstants'
import { HOME_SERVICES } from '../data/homeContent'
import { useScrollReveal } from '../../hooks/useScrollReveal'

function HomeServiceBar() {
  const ref = useScrollReveal()
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
    <section ref={ref} className="jewelsium-services section-reveal" aria-label="Store benefits">
      <div className="jewelsium-services__strip" role="note">
        Complimentary shipping over {formatInr(freeShippingThreshold)} - trusted quality guaranteed
      </div>
      <div className="section-container grid grid-cols-2 gap-4 py-6 sm:grid-cols-4 sm:gap-5 sm:py-8">
        {services.map((item) => (
          <div key={item.title} className="jewelsium-service-card">
            <span className="jewelsium-service-card__icon">
              <i className={`fa-regular ${item.icon}`} aria-hidden />
            </span>
            <h2 className="jewelsium-service-card__title">{item.title}</h2>
            <p className="jewelsium-service-card__text">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HomeServiceBar
