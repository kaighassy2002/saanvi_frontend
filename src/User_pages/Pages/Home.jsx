import React from 'react'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { STORE_NAME } from '../../services/storefrontConstants'
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
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  usePageMeta({
    title: STORE_NAME,
    description:
      'Discover fine jewellery at Aashmika Designs — new arrivals, trending pieces, and timeless designs. Shop online with COD and secure payment.',
  })

  return (
    <div id="main-content" className="page-shell page-shell--jewelsium" tabIndex={-1}>
      <SiteHeader showSearch showAnnouncement />

      {isDesktop ? (
        <div className="home-view--desktop">
          <HomeHeroSlider />
          <HomeServiceBar />
          <HomePromoBanners />
          <HomeTrendingProducts />
          <HomePopularCategories />
        </div>
      ) : (
        <HomeMobileView />
      )}

      <Footer />
    </div>
  )
}

export default Home
