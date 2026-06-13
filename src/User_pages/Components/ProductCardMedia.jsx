import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getProductImages } from '../utils/productImages'
import { productImageAttrs } from '../../utils/cloudinaryImage'

/**
 * Listing card media — shows first image by default; auto-cycles on hover when multiple images exist.
 */
export default function ProductCardMedia({
  product,
  alt,
  className = '',
  imageClassName = 'store-product-card__media-img p-3 sm:p-4 transition duration-500 group-hover:scale-[1.03]',
  compact = false,
  singleImage = false,
}) {
  const imageAttrs = useMemo(() => {
    const raw = getProductImages(product)
    const list = raw.map((url) => productImageAttrs(url, 'card'))
    return singleImage ? list.slice(0, 1) : list
  }, [product, singleImage])
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [touching, setTouching] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const intervalRef = useRef(null)
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)
  const suppressClickRef = useRef(false)

  const hasMultiple = imageAttrs.length > 1
  const activeAttrs = imageAttrs[index] || imageAttrs[0] || { src: '' }

  const stopCycle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startCycle = useCallback(() => {
    if (!hasMultiple || imageAttrs.length < 2) return
    stopCycle()
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % imageAttrs.length)
    }, 2600)
  }, [hasMultiple, imageAttrs.length, stopCycle])

  useEffect(() => {
    setIndex(0)
  }, [product?.id, imageAttrs.map((a) => a.src).join('|')])

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
    const total = imageAttrs.length
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

  if (!activeAttrs.src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#f8f2e7] font-playfair text-xs text-muted">
        No image
      </div>
    )
  }

  const imgClass =
    imageClassName ||
    className ||
    'store-product-card__media-img h-full w-full object-contain object-center p-3 sm:p-4'

  return (
    <div
      className="absolute inset-0 overflow-hidden"
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
      <div
        className="flex h-full w-full"
        style={{
          transform: `translate3d(calc(${-index * 100}% + ${dragOffset}px), 0, 0)`,
          transition: touching ? 'none' : 'transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {imageAttrs.map((attrs, i) => (
          <div
            key={`${attrs.src}-${i}`}
            className="relative h-full w-full shrink-0 grow-0 basis-full bg-[#f8f2e7]"
          >
            <img
              src={attrs.src}
              srcSet={attrs.srcSet}
              sizes={attrs.sizes}
              alt={alt}
              loading="lazy"
              decoding="async"
              className={imgClass}
            />
          </div>
        ))}
      </div>

      {hasMultiple ? (
        <>
          <span
            className={`absolute bottom-2 left-2 z-[1] rounded-full bg-black/50 px-2 py-0.5 font-playfair text-[10px] text-white ${
              compact ? 'bottom-1 left-1 text-[9px]' : ''
            }`}
          >
            {index + 1}/{imageAttrs.length}
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
            {imageAttrs.map((_, i) => (
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
