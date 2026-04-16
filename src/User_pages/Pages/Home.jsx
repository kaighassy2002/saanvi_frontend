import React from 'react'
import { Link } from 'react-router-dom'
import NewArrivals from '../Components/NewArrivals'
import Category from '../Components/Category'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'

const spotlightCards = [
  {
    title: 'Bridal Grandeur',
    text: 'Layered temple work, heirloom textures, and wedding-day brilliance.',
    image: 'https://i.pinimg.com/1200x/15/01/56/150156ac3ced91e62c6d30b5cf2f4d1b.jpg',
    link: '/collections?category=Bridal%20Set',
    cta: 'View Bridal Sets',
  },
  {
    title: 'Statement Evenings',
    text: 'Rich stones and sculpted silhouettes designed for festive nights.',
    image: 'https://i.pinimg.com/1200x/61/8e/86/618e86914fcb22d4ef7199e0874ca8b6.jpg',
    link: '/collections?category=Bracelets',
    cta: 'See Statement Pieces',
  },
]

const serviceHighlights = [
  {
    icon: 'fa-certificate',
    title: 'Curated Craftsmanship',
    text: 'Each design is selected for finish, detailing, and occasion-ready elegance.',
  },
  {
    icon: 'fa-gift',
    title: 'Celebration Packaging',
    text: 'Thoughtful presentation that feels premium from unboxing to gifting.',
  },
  {
    icon: 'fa-truck-fast',
    title: 'Smooth Delivery',
    text: 'Fast dispatch and dependable delivery support across your festive orders.',
  },
]

function Home() {
  return (
    <div className="page-shell">
      <section className="section ">
        <div className="relative overflow-hidden border-[#a8844a] bg-[#1b0c10] shadow-[0_42px_100px_-48px_rgba(58,21,29,0.98)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(242,217,171,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(242,217,171,0.08),_transparent_20%)]" />
          <SiteHeader showSearch inHero />
          <img
            src="https://i.pinimg.com/1200x/37/7d/1b/377d1b3254fa315d025a0263cabcd6b9.jpg"
            alt="Luxury jewellery hero"
            className="h-[560px] w-full object-cover object-center sm:h-[700px] lg:h-[760px]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,4,5,0.96)_0%,rgba(17,8,11,0.93)_30%,rgba(24,11,15,0.72)_56%,rgba(21,10,14,0.44)_74%,rgba(16,8,11,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,2,3,0.28)_0%,rgba(4,2,3,0.38)_48%,rgba(4,2,3,0.58)_100%)]" />

          <div className="absolute inset-0 flex flex-col p-5 sm:p-8 lg:p-10">
            <div className="mx-auto grid h-full w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
              <div className="pt-20 sm:pt-24 lg:pt-16">
                <p className="inline-flex rounded-full border border-[#f2d9ab70] bg-[#2a111688] px-3.5 py-1.5 text-kicker text-[#f3ddb4] shadow-[0_12px_28px_-24px_rgba(0,0,0,0.9)] backdrop-blur">
                  The SAANVI Signature Edit
                </p>
                <h1 className="mt-5 max-w-lg font-bodoni text-4xl leading-[1.02] text-[#fff4e6] sm:text-5xl lg:text-[3.85rem]">
                  SAANVI Jewellery for Timeless Celebrations
                </h1>
                <p className="mt-5 max-w-md text-sm leading-7 text-[#f1ddbf] sm:text-base">
                  Discover the SAANVI collection of handcrafted pieces shaped by heritage detail
                  and modern festive elegance.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/collections" className="lux-button px-7 py-3 text-sm">
                    Shop SAANVI Collection
                  </Link>
                  <Link
                    to="/collections?category=Bridal%20Set"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f0d8a080] bg-[#fff6e312] px-6 py-4 font-playfair text-sm font-medium tracking-[0.1em] text-[#fff0ce] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-[#f0d79e] hover:bg-[#fff6e62a] hover:text-white hover:shadow-[0_24px_40px_-26px_rgba(0,0,0,0.9)] sm:text-base"
                  >
                    Explore Bridal Edit
                    <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden />
                  </Link>
                </div>
                <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-kicker text-[#f2d9ab]">
                  <span className="inline-flex items-center gap-2">
                    <i className="fa-solid fa-certificate text-[#f1d08b]" aria-hidden />
                    Premium finish
                  </span>
                  <span className="h-3 w-px bg-[#c79f58]/60" />
                  <span className="inline-flex items-center gap-2">
                    <i className="fa-solid fa-sparkles text-[#f1d08b]" aria-hidden />
                    Curated collections
                  </span>
                  <span className="h-3 w-px bg-[#c79f58]/60" />
                  <span className="inline-flex items-center gap-2">
                    <i className="fa-solid fa-truck-fast text-[#f1d08b]" aria-hidden />
                    Fast delivery
                  </span>
                </div>

              </div>

              <div className="hidden items-center justify-end lg:flex">
                <div className="relative w-full max-w-[400px]">
                  <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-[#d6af5b1f] blur-3xl" />
                  <div className="absolute -right-8 bottom-6 h-32 w-32 rounded-full bg-[#f5ddb01c] blur-3xl" />

                  <div className="relative overflow-hidden rounded-[2rem] border border-[#d2a967] bg-[linear-gradient(180deg,rgba(255,247,234,0.14),rgba(255,247,234,0.06))] p-3.5 shadow-[0_30px_70px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl transition duration-500 hover:-translate-y-1">
                    <img
                      src="https://i.pinimg.com/1200x/15/01/56/150156ac3ced91e62c6d30b5cf2f4d1b.jpg"
                      alt="Bridal jewellery"
                      className="h-[455px] w-full rounded-[1.55rem] object-cover"
                    />
                    
                  </div>

                  <div className="absolute -left-12 bottom-8 w-48 rounded-[1.3rem] border border-[#c79f58] bg-[linear-gradient(180deg,rgba(24,9,12,0.84),rgba(24,9,12,0.94))] p-4 text-[#ffefda] shadow-[0_28px_60px_-34px_rgba(0,0,0,0.95)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
                    <p className="text-kicker text-[#f1d08b]">
                      Private Client Feel
                    </p>
                    <p className="mt-2 font-bodoni text-[2rem] leading-none">230K</p>
                  </div>

                  <div className="absolute -right-6 top-12 w-44 rounded-[1.3rem] border border-[#c79f58] bg-[linear-gradient(180deg,rgba(24,9,12,0.84),rgba(24,9,12,0.94))] p-4 text-[#ffefda] shadow-[0_28px_60px_-34px_rgba(0,0,0,0.95)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
                    <p className="text-kicker text-[#f1d08b]">
                      Editor's Pick
                    </p>
                    <p className="mt-2 font-bodoni text-[1.9rem] leading-none">4.9/5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pb-8 pt-3 sm:pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          {serviceHighlights.map((item, index) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-[1.35rem] border border-[#e5d4bd] bg-[linear-gradient(160deg,#fffdfa_0%,#fff6e8_100%)] p-4 shadow-[0_14px_30px_-26px_rgba(58,21,29,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_-24px_rgba(58,21,29,0.65)] sm:p-5"
            >
              <span className="absolute right-4 top-3 font-playfair text-[10px] tracking-[0.16em] text-[#d2b37a]">
                0{index + 1}
              </span>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eddcc3] bg-[#fbf1e2] text-sm text-gold transition group-hover:bg-[#f7e4c4]">
                <i className={`fa-solid ${item.icon}`} aria-hidden />
              </div>

              <h2 className="mt-3 font-bodoni text-xl text-ink">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <NewArrivals />

      <section className="section-container py-4 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lux-card overflow-hidden p-6 sm:p-8">
            <p className="text-overline">Designed To Explore</p>
            <h2 className="mt-3 max-w-xl font-bodoni text-3xl text-ink sm:text-4xl">
              Find the right piece faster with a more editorial shopping flow
            </h2>
            <p className="mt-4 max-w-2xl text-helper">
              The home page now leads with a clearer premium message, showcases standout
              categories, and creates a stronger visual bridge into product discovery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/collections" className="lux-button">
                Browse All Jewellery
              </Link>
              <Link to="/wishlist" className="lux-button-outline">
                View Wishlist
              </Link>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {spotlightCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[#dcc6a6] shadow-[0_22px_50px_-36px_rgba(58,21,29,0.75)]"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b0b10f2] via-[#37151cb5] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-[#fff3df] sm:p-6">
                  <p className="text-meta uppercase text-[#f0d9af]">Spotlight</p>
                  <h2 className="mt-2 font-bodoni text-2xl">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#f6e8cf]">{card.text}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-playfair text-sm text-gold">
                    {card.cta}
                    <i className="fa-solid fa-arrow-right transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

     
       {/* <NewArrivals /> */}
      <Category />
      
      <Footer />
    </div>
  )
}

export default Home
