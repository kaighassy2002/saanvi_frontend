import React from 'react'
import SiteHeader from '../Components/SiteHeader'
import Footer from '../Components/Footer'
import HomeHeroSlider from '../Components/HomeHeroSlider'
import HomeServiceBar from '../Components/HomeServiceBar'
import HomePromoBanners from '../Components/HomePromoBanners'
import HomeTrendingProducts from '../Components/HomeTrendingProducts'
import HomePopularCategories from '../Components/HomePopularCategories'
import HomeMobileView from '../Components/home/HomeMobileView'

import '../Styles/home-jewelsium.css'
import '../Styles/home-mobile.css'

function Home() {
  return (
    <div id="main-content" className="page-shell page-shell--jewelsium" tabIndex={-1}>
      <SiteHeader showSearch showAnnouncement />

      <HomeMobileView />

      <div className="home-view--desktop">
        <HomeHeroSlider />
        <HomeServiceBar />
        <HomePromoBanners />
        <HomeTrendingProducts />
        <HomePopularCategories />
      </div>

      <Footer />
    </div>
  )
}

export default Home
