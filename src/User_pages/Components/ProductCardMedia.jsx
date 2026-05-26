import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getProductImages } from '../utils/productImages'

/**
 * Listing card media — shows first image by default; auto-cycles on hover when multiple images exist.
 */
export default function ProductCardMedia({
  product,
  alt,
  className = 'h-full w-full object-contain p-3 sm:p-4 transition duration-500 group-hover:scale-[1.03]',
  imageClassName,
  compact = false,
}) {
  const images = getProductImages(product)
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [touching, setTouching] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const intervalRef = useRef(null)
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)
  const suppressClickRef = useRef(false)

  const hasMultiple = images.length > 1
  const src = images[index] || images[0] || ''

  const stopCycle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startCycle = useCallback(() => {
    if (!hasMultiple || images.length < 2) return
    stopCycle()
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, 2600)
  }, [hasMultiple, images.length, stopCycle])

  useEffect(() => {
    setIndex(0)
  }, [product?.id, images.join('|')])

  useEffect(() => stopCycle, [stopCycle])

  useEffect(() => {
    if (!hasMultiple || !hovering) {
      stopCycle()
      return undefined
    }
    startCycle()
    return stopCycle
  }, [hasMultiple, hovering, startCycle, stopCycle])

  const handleMouseEnter = () => {
    setHovering(true)
  }

  const handleMouseLeave = () => {
    setHovering(false)
    stopCycle()
    setIndex(0)
  }

  const goTo = (nextIndex) => {
    if (!hasMultiple) return
    const total = images.length
    setIndex((nextIndex + total) % total)
  }

  const goNext = () => goTo(index + 1)
  const goPrev = () => goTo(index - 1)

  const handleTouchStart = (e) => {
    if (!hasMultiple) return
    setTouching(true)
    stopCycle()
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    setDragOffset(0)
  }

  const handleTouchMove = (e) => {
    if (!hasMultiple || !touching) return
    const currentX = e.touches[0].clientX
    const delta = currentX - touchStartX.current
    touchDeltaX.current = delta
    setDragOffset(delta)
  }

  const handleTouchEnd = () => {
    if (!hasMultiple) return
    const threshold = 36
    const delta = touchDeltaX.current
    if (Math.abs(delta) > threshold) {
      suppressClickRef.current = true
      if (delta < 0) goNext()
      else goPrev()
    }
    touchDeltaX.current = 0
    setDragOffset(0)
    setTouching(false)
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 220)
  }

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f0e6d6] font-playfair text-xs text-muted">
        No image
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full max-w-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClickCapture={(e) => {
        if (!suppressClickRef.current) return
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div className="h-full w-full max-w-full overflow-hidden">
        <div
          className="flex h-full w-full max-w-full"
          style={{
            transform: `translate3d(calc(${-index * 100}% + ${dragOffset}px), 0, 0)`,
            transition: touching ? 'none' : 'transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        >
          {images.map((imageSrc, i) => (
            <img
              key={`${imageSrc}-${i}`}
              src={imageSrc}
              alt={alt}
              loading="lazy"
              className={`${imageClassName || className} h-full min-w-full flex-shrink-0`}
            />
          ))}
        </div>
      </div>

      {hasMultiple ? (
        <>
          <span
            className={`absolute bottom-2 left-2 z-[1] rounded-full bg-black/50 px-2 py-0.5 font-playfair text-[10px] text-white ${
              compact ? 'bottom-1 left-1 text-[9px]' : ''
            }`}
          >
            {index + 1}/{images.length}
          </span>

          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-[1] hidden items-center justify-between px-2 md:flex">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goPrev()
              }}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#eadbc5] bg-white/90 text-[#7a2c3a] opacity-0 shadow-sm transition group-hover:opacity-100"
              aria-label="Previous image"
            >
              <i className="fa-solid fa-chevron-left text-[11px]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goNext()
              }}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#eadbc5] bg-white/90 text-[#7a2c3a] opacity-0 shadow-sm transition group-hover:opacity-100"
              aria-label="Next image"
            >
              <i className="fa-solid fa-chevron-right text-[11px]" aria-hidden />
            </button>
          </div>

          <div
            className={`absolute bottom-2 right-2 z-[1] flex gap-1 ${
              compact ? 'bottom-1 right-1' : ''
            }`}
            onClick={(e) => e.preventDefault()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goTo(i)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`rounded-full transition ${
                  i === index
                    ? 'bg-gold'
                    : 'bg-white/80 hover:bg-white'
                } ${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'}`}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
