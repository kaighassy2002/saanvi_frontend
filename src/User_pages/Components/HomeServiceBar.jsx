import React from 'react'
import { useHomeContent } from '../../hooks/useHomeContent'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { formatFontAwesomeIcon } from '../../utils/fontAwesomeIcon'

function HomeServiceBar() {
  const ref = useScrollReveal()
  const { homeServices, serviceBarStrip } = useHomeContent()

  return (
    <section ref={ref} className="jewelsium-services section-reveal" aria-label="Store benefits">
      {serviceBarStrip ? (
        <div className="jewelsium-services__strip" role="note">
          {serviceBarStrip}
        </div>
      ) : null}
      <div className="section-container grid grid-cols-2 gap-4 py-6 sm:grid-cols-4 sm:gap-5 sm:py-8">
        {homeServices.map((item, index) => (
          <div key={`${item.title}-${index}`} className="jewelsium-service-card">
            <span className="jewelsium-service-card__icon">
              <i className={formatFontAwesomeIcon(item.icon)} aria-hidden />
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
