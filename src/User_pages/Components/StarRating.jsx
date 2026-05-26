import React from 'react'

function StarRating({
  value = 0,
  max = 5,
  size = 'sm',
  interactive = false,
  onChange,
  label,
}) {
  const stars = Array.from({ length: max }, (_, i) => i + 1)
  const sizeClass =
    size === 'lg' ? 'text-lg sm:text-xl' : size === 'md' ? 'text-base' : 'text-sm'

  return (
    <div className="inline-flex flex-col gap-1" role={interactive ? 'group' : undefined}>
      {label ? (
        <span className="font-playfair text-xs text-muted">{label}</span>
      ) : null}
      <div
        className={`inline-flex items-center gap-0.5 ${sizeClass}`}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={interactive ? undefined : `Rated ${value} out of ${max} stars`}
      >
        {stars.map((star) => {
          const filled = star <= Math.round(value)
          const half = !filled && star - 0.5 <= value
          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange?.(star)}
                className="text-[#d4c4a8] transition hover:scale-110 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a2c3a]/30"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                <i
                  className={`fa-star ${star <= value ? 'fa-solid text-gold' : 'fa-regular'}`}
                  aria-hidden
                />
              </button>
            )
          }
          return (
            <span key={star} className={filled || half ? 'text-gold' : 'text-[#d4c4a8]'} aria-hidden>
              <i className={`fa-star ${filled ? 'fa-solid' : half ? 'fa-solid fa-star-half-stroke' : 'fa-regular'}`} />
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function StarRatingCompact({ average, count, className = '' }) {
  if (!count || count <= 0) return null
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <StarRating value={average} size="sm" />
      <span className="font-playfair text-xs text-muted">
        {average.toFixed(1)} ({count})
      </span>
    </div>
  )
}

export default StarRating
