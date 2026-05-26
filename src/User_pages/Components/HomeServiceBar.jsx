import React from 'react'

import { HOME_SERVICES } from '../data/homeContent'

function HomeServiceBar() {
  return (
    <section className="jewelsium-services" aria-label="Store benefits">
      <div className="section-container grid grid-cols-2 gap-6 py-8 sm:grid-cols-4 sm:gap-4 sm:py-10">
        {HOME_SERVICES.map((item) => (
          <div key={item.title} className="flex flex-col items-center text-center sm:px-2">
            <span className="flex h-12 w-12 items-center justify-center text-xl text-[#1f1514]">
              <i className={`fa-regular ${item.icon}`} aria-hidden />
            </span>
            <h2 className="mt-2 font-playfair text-sm font-semibold text-[#1f1514]">{item.title}</h2>
            <p className="mt-1 font-playfair text-xs leading-relaxed text-[#6f5d5b]">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HomeServiceBar
