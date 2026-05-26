import React from 'react'
import { Link } from 'react-router-dom'
import ProductCardMedia from './ProductCardMedia'
import { StarRatingCompact } from './StarRating'
import { STORE_NAME } from '../../services/storefrontConstants'

/**
 * Unified storefront product card.
 * @param {'home' | 'grid' | 'compact'} variant
 */
function StoreProductCard({
  product,
  saved,
  onToggleWishlist,
  reviewSummary,
  variant = 'grid',
}) {
  const price = Number(product.price || 0)
  const originalPrice = Number(product.originalPrice || 0)
  const discount =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0
  const inStock = Number(product.stock ?? 0) > 0
  const isHome = variant === 'home'
  const isCompact = variant === 'compact'

  const imageWrapClass = isCompact
    ? 'store-product-card__media-wrap aspect-[10/11]'
    : isHome
      ? 'store-product-card__media-wrap store-product-card__media-wrap--square'
      : 'store-product-card__media-wrap store-product-card__media-wrap--tall collection-card__image'

  const articleClass = [
    'store-product-card group flex h-full flex-col',
    isHome ? 'store-product-card--home' : '',
    isCompact ? 'store-product-card--compact' : 'store-product-card--grid',
    !isHome && !isCompact ? 'collection-card collection-card--myntra' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const bodyAlign = isHome ? 'text-center' : ''
  const titleClass = isCompact
    ? 'line-clamp-2 font-sans text-[11px] leading-snug text-muted'
    : isHome
      ? 'line-clamp-2 font-playfair text-sm leading-snug text-ink transition group-hover:text-royal-700'
      : 'collection-card__title line-clamp-2 font-playfair text-sm leading-snug text-ink'

  return (
    <article className={articleClass}>
      <div className={imageWrapClass}>
        {discount > 0 ? (
          <span className="store-product-card__badge">
            {isCompact ? `↓${discount}%` : `${discount}% off`}
          </span>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onToggleWishlist()
          }}
          className={`store-product-card__wishlist ${isCompact ? 'store-product-card__wishlist--sm' : ''}`}
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`fa-heart text-sm ${saved ? 'fa-solid text-gold' : 'fa-regular'}`} aria-hidden />
        </button>

        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <ProductCardMedia
            product={product}
            alt={product.name}
            compact={isCompact}
            className={`h-full w-full object-contain transition duration-300 ${
              isCompact ? 'p-2 group-hover:scale-[1.02]' : 'p-3 sm:p-4 group-hover:scale-[1.03]'
            }`}
          />
        </Link>

        {!inStock && !isHome ? (
          <div className="store-product-card__oos">Out of stock</div>
        ) : null}
      </div>

      <div
        className={`store-product-card__body ${bodyAlign} ${
          isCompact ? 'px-1.5 pb-2 pt-1' : isHome ? 'px-1 pb-2 pt-3 sm:px-2' : 'collection-card__body px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5'
        }`}
      >
        {isHome ? (
          <p className="store-product-card__brand">{STORE_NAME}</p>
        ) : null}

        <Link to={`/product/${product.id}`} className="block flex-1">
          <h3 className={titleClass}>{product.name}</h3>
        </Link>

        {reviewSummary?.count > 0 ? (
          <StarRatingCompact
            average={reviewSummary.average}
            count={reviewSummary.count}
            className={`${isHome ? 'mt-1.5 justify-center' : isCompact ? 'mt-1' : 'mt-1.5'}`}
          />
        ) : isHome ? (
          <div className="mt-1.5 flex justify-center gap-0.5 text-beige-dark" aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <i key={i} className="fa-regular fa-star text-xs" />
            ))}
          </div>
        ) : null}

        <div
          className={`flex flex-wrap items-baseline gap-x-1.5 ${
            isHome ? 'mt-2 justify-center gap-x-2' : isCompact ? 'mt-1' : 'mt-1.5 gap-x-2'
          }`}
        >
          <span
            className={`font-semibold text-ink ${
              isHome ? 'text-price text-sm' : isCompact ? 'font-playfair text-sm' : 'collection-card__price font-playfair text-sm'
            }`}
          >
            ₹{price.toLocaleString()}
          </span>
          {discount > 0 ? (
            <>
              <span className={`price-strike ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                ₹{originalPrice.toLocaleString()}
              </span>
              {!isCompact && !isHome ? (
                <span className="font-playfair text-xs font-medium text-gold-dark">
                  ({discount}% OFF)
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default StoreProductCard
