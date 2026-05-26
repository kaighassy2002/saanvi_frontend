import React from 'react'
import HomeMobileHero from './HomeMobileHero'
import HomeMobileQuickShop from './HomeMobileQuickShop'
import HomeMobileServices from './HomeMobileServices'
import HomeMobilePromos from './HomeMobilePromos'
import HomeMobileTrending from './HomeMobileTrending'
import HomeMobileCategories from './HomeMobileCategories'

function HomeMobileView() {
  return (
    <div className="home-mobile home-view--mobile">
      <HomeMobileHero />
      <HomeMobileQuickShop />
      <HomeMobileServices />
      <HomeMobilePromos />
      <HomeMobileTrending />
      <HomeMobileCategories />
    </div>
  )
}

export default HomeMobileView
