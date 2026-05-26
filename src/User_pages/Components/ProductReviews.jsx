import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useProductReviews } from '../../hooks/useProductReviews'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'
import StarRating from './StarRating'
import '../Styles/product-reviews.css'

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function initials(name) {
  const parts = String(name || 'C')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.[0] || 'C').toUpperCase()
}

/** When review count exceeds this, show a random preview + “View all”. */
const REVIEW_COLLAPSE_THRESHOLD = 15
const REVIEW_PREVIEW_COUNT = 5

function shuffleArray(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function sortReviewsNewestFirst(items) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )
}

function buildRatingBreakdown(reviews) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const review of reviews) {
    const n = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 0)))
    counts[n] += 1
  }
  const total = reviews.length || 1
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: counts[star],
    pct: reviews.length ? Math.round((counts[star] / total) * 100) : 0,
  }))
}

function ProductReviews({ productId, reviewsState: externalState }) {
  const location = useLocation()
  const internal = useProductReviews(productId)
  const {
    reviews,
    summary,
    myReview,
    hasPurchased,
    canReview,
    loading,
    submitting,
    error,
    submit,
  } = externalState || internal
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const signedIn = isCustomerLoggedIn()

  useEffect(() => {
    setShowAllReviews(false)
  }, [productId])

  const sortedReviews = useMemo(() => sortReviewsNewestFirst(reviews), [reviews])

  const previewReviews = useMemo(
    () => shuffleArray(sortedReviews).slice(0, REVIEW_PREVIEW_COUNT),
    [sortedReviews, productId],
  )

  const shouldCollapseList = sortedReviews.length > REVIEW_COLLAPSE_THRESHOLD
  const visibleReviews =
    shouldCollapseList && !showAllReviews ? previewReviews : sortedReviews

  const breakdown = useMemo(() => buildRatingBreakdown(reviews), [reviews])
  const redirect = encodeURIComponent(`${location.pathname}${location.search}#reviews`)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormSuccess('')
    const ok = await submit({ rating, title, body })
    if (ok) {
      setFormSuccess('Thank you! Your review has been submitted for approval.')
      setTitle('')
      setBody('')
      setRating(5)
    }
  }

  return (
    <section id="reviews" className="product-reviews section-container" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="font-bodoni text-2xl text-ink sm:text-3xl">
        Customer reviews
      </h2>
      <p className="mt-1 font-playfair text-sm text-muted">
        Verified feedback from shoppers who purchased this piece.
      </p>

      {loading ? (
        <div className="mt-8 space-y-3">
          <div className="product-reviews__skeleton" />
          <div className="product-reviews__skeleton" />
        </div>
      ) : (
        <>
          <div className="product-reviews__header mt-8">
            <div className="product-reviews__score-card">
              <span className="product-reviews__score" aria-hidden>
                {summary.count > 0 ? summary.average.toFixed(1) : '—'}
              </span>
              <StarRating value={summary.count > 0 ? summary.average : 0} size="md" />
              <p className="product-reviews__score-meta">
                {summary.count > 0
                  ? `Based on ${summary.count} review${summary.count === 1 ? '' : 's'}`
                  : 'No reviews yet'}
              </p>
            </div>

            {summary.count > 0 ? (
              <div className="product-reviews__breakdown" aria-label="Rating distribution">
                {breakdown.map((row) => (
                  <div key={row.star} className="product-reviews__breakdown-row">
                    <span>{row.star} ★</span>
                    <div className="product-reviews__breakdown-bar">
                      <div
                        className="product-reviews__breakdown-fill"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span>{row.count}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {myReview ? (
            <div className="product-reviews__panel">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="product-reviews__panel-title">Your review</h3>
                {myReview.status === 'pending' ? (
                  <span className="product-reviews__status product-reviews__status--pending">
                    Pending approval
                  </span>
                ) : null}
                {myReview.status === 'rejected' ? (
                  <span className="product-reviews__status product-reviews__status--rejected">
                    Not published
                  </span>
                ) : null}
              </div>
              <StarRating value={myReview.rating} size="md" />
              {myReview.title ? (
                <p className="product-reviews__card-title mt-3">{myReview.title}</p>
              ) : null}
              <p className="product-reviews__card-body mt-1">{myReview.body}</p>
            </div>
          ) : canReview ? (
            <div className="product-reviews__panel">
              <h3 className="product-reviews__panel-title">Write a review</h3>
              <p className="mb-4 font-playfair text-xs text-success">
                <i className="fa-solid fa-circle-check mr-1" aria-hidden />
                Verified purchase — your review helps other buyers.
              </p>
              <form onSubmit={handleSubmit} className="product-reviews__form">
                <StarRating
                  value={rating}
                  interactive
                  onChange={setRating}
                  size="lg"
                  label="Your rating"
                />
                <div>
                  <label className="form-label" htmlFor="review-title">
                    Title (optional)
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="royal-input"
                    maxLength={120}
                    placeholder="Beautiful craftsmanship"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="review-body">
                    Your review
                  </label>
                  <textarea
                    id="review-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="royal-input min-h-[120px] resize-y"
                    required
                    minLength={10}
                    maxLength={2000}
                    placeholder="Share details about quality, finish, and how it looked on your occasion."
                  />
                </div>
                {error ? (
                  <p className="font-playfair text-sm text-[#7a2c3a]" role="alert">
                    {error}
                  </p>
                ) : null}
                {formSuccess ? (
                  <p className="font-playfair text-sm text-success" role="status">
                    {formSuccess}
                  </p>
                ) : null}
                <button type="submit" disabled={submitting} className="lux-button w-fit disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            </div>
          ) : signedIn && !hasPurchased ? (
            <div className="product-reviews__panel product-reviews__panel--muted">
              <h3 className="product-reviews__panel-title">Reviews are for verified buyers</h3>
              <p className="font-playfair text-sm text-muted">
                Purchase this product first, then return here to share your experience.
              </p>
              <Link to="/collections" className="button-tertiary mt-4 inline-flex text-sm">
                Continue shopping
              </Link>
            </div>
          ) : !signedIn ? (
            <div className="product-reviews__panel product-reviews__panel--muted">
              <h3 className="product-reviews__panel-title">Sign in to review</h3>
              <p className="font-playfair text-sm text-muted">
                Only customers who purchased this product can submit a review.
              </p>
              <Link to={`/auth?redirect=${redirect}`} className="lux-button mt-4 inline-flex text-sm">
                Sign in
              </Link>
            </div>
          ) : null}

          {sortedReviews.length > 0 ? (
            <>
            <ul className="product-reviews__list">
              {visibleReviews.map((review) => (
                <li key={review.id} className="product-reviews__card">
                  <div className="product-reviews__card-top">
                    <div className="product-reviews__author">
                      <span className="product-reviews__avatar" aria-hidden>
                        {initials(review.customerName)}
                      </span>
                      <div className="min-w-0">
                        <p className="product-reviews__author-name">
                          {review.customerName || 'Verified customer'}
                        </p>
                        <p className="product-reviews__author-meta">{formatDate(review.createdAt)}</p>
                        <span className="product-reviews__verified">
                          <i className="fa-solid fa-badge-check text-[10px]" aria-hidden />
                          Verified buyer
                        </span>
                      </div>
                    </div>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  {review.title ? <p className="product-reviews__card-title">{review.title}</p> : null}
                  <p className="product-reviews__card-body">{review.body}</p>
                </li>
              ))}
            </ul>
            {shouldCollapseList ? (
              <div className="product-reviews__more">
                {!showAllReviews ? (
                  <>
                    <p className="product-reviews__more-hint font-playfair text-sm text-muted">
                      Showing {visibleReviews.length} of {sortedReviews.length} reviews
                    </p>
                    <button
                      type="button"
                      className="product-reviews__more-btn"
                      onClick={() => setShowAllReviews(true)}
                    >
                      View all {sortedReviews.length} reviews
                      <i className="fa-solid fa-chevron-down text-xs" aria-hidden />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="product-reviews__more-btn"
                    onClick={() => setShowAllReviews(false)}
                  >
                    Show fewer reviews
                    <i className="fa-solid fa-chevron-up text-xs" aria-hidden />
                  </button>
                )}
              </div>
            ) : null}
            </>
          ) : (
            <p className="product-reviews__empty">
              {hasPurchased && canReview
                ? 'No published reviews yet — yours could be the first.'
                : 'No reviews yet for this product.'}
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default ProductReviews
