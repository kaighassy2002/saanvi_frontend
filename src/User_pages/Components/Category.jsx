import React from 'react'
import { Link } from 'react-router-dom'

function Category() {
  const categories = [
    {
      name: 'Necklace',
      image: 'https://i.pinimg.com/1200x/37/71/51/3771511e2d33eceb2b37b5c66d993071.jpg'
    },
    {
      name: 'Bridal Set',
      image: 'https://i.pinimg.com/736x/05/cb/2a/05cb2a824fa78fffe6e2203d5454fd56.jpg'
    },
    {
      name: 'Earrings',
      image: 'https://i.pinimg.com/1200x/17/79/74/1779744cf8b937e59ccea81ffd894833.jpg'
    },
    {
      name: 'Ring',
      image: 'https://i.pinimg.com/1200x/d2/aa/29/d2aa29e9c7f78ff33efec124ca243814.jpg'
    },
    {
      name: 'Anklet',
      image: 'https://i.pinimg.com/1200x/f4/98/d2/f498d2e89d1f88d4ea2631b61365506c.jpg'
    },
    {
      name: 'Matti',
      image: 'https://i.pinimg.com/736x/21/80/36/21803675edcabe227827f723378e0da4.jpg'
    },
    {
      name: 'Nose Accessories',
      image: 'https://i.pinimg.com/736x/21/c0/ae/21c0ae327b634a9610a1c87ffbf540d7.jpg'
    },
    {
      name: 'Bangles ',
      image: 'https://i.pinimg.com/1200x/d6/f5/d5/d6f5d541fb18a5ada1b3f8537c904250.jpg'
    },
    {
      name: 'Bracelets',
      image: 'https://i.pinimg.com/1200x/61/8e/86/618e86914fcb22d4ef7199e0874ca8b6.jpg'
    },
    {
      name: 'Hair Accessories',
      image: 'https://i.pinimg.com/1200x/d2/7c/9a/d27c9ad94136f2071c2cab135a8ae801.jpg'
    }
  ]

  return (
    <section className="section-container py-14 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="text-overline">Shop by Category</p>
          <h2 className="mt-2 section-heading">Discover Signature Jewellery Types</h2>
          <p className="section-subheading max-w-2xl">
            Browse by style to quickly reach the pieces that match your occasion and mood.
          </p>
        </div>
        <Link to="/collections" className="button-tertiary">
          Browse all products
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={index}
            to={`/collections?category=${encodeURIComponent(category.name.trim())}`}
            className="group relative overflow-hidden rounded-[1.5rem] border border-[#e3d2b8] bg-white shadow-[0_18px_40px_-32px_rgba(58,21,29,0.62)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_52px_-30px_rgba(58,21,29,0.7)] focus-visible:ring-2 focus-visible:ring-[#7a2c3a]/35"
          >
            <div className="relative h-52 overflow-hidden sm:h-56">
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#19090de0] via-[#2d0f1685] to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#f2d7a5]">Category</p>
                <h3 className="mt-1 font-bodoni text-2xl text-[#fff3df]">{category.name}</h3>
                <span className="mt-3 inline-flex items-center gap-2 font-playfair text-sm text-[#f2d7a5]">
                  Shop now
                  <i
                    className="fa-solid fa-arrow-right text-xs transition group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Category