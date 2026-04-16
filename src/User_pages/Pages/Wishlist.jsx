import React from 'react'
import { Link } from 'react-router-dom'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { useWishlist } from '../../hooks/useWishlist'

function Wishlist() {
  const { items, remove } = useWishlist()

  return (
    <div className="page-shell">
      <SiteHeader />
      <section className="section-container py-10 sm:py-14">
        <div className="mb-8 text-center">
          <h1 className="section-heading">My Wishlist</h1>
          <p className="section-subheading mx-auto">Your saved favorites in one place.</p>
        </div>

        {items.length === 0 ? (
          <div className="lux-card py-16 text-center sm:py-20">
            <div className="mb-6 sm:mb-8">
              <i className="fa-regular fa-heart text-6xl text-[#c9b7a1]"></i>
            </div>
            <h2 className="card-heading mb-3 sm:mb-4">Your wishlist is empty</h2>
            <p className="mb-6 px-4 text-helper sm:mb-8">Tap the heart on any product to save it here.</p>
            <Link to="/collections" className="lux-button">
              Browse collections
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <div
                key={product.productId}
                className="lux-card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link to={`/product/${product.productId}`} className="block">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="px-4 py-4">
                    <h3 className="card-title">{product.name}</h3>
                    <p className="mt-2 text-price">₹{Number(product.price).toLocaleString()}</p>
                  </div>
                </Link>
                <div className="border-t border-[#eadfc9] px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => remove(product.productId)}
                    className="button-tertiary w-full py-2"
                  >
                    Remove from wishlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  )
}

export default Wishlist
