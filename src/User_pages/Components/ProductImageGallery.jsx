import React, { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Thumbs, Keyboard, A11y } from 'swiper/modules'
import { getProductImages } from '../utils/productImages'
import { productImageUrl } from '../../utils/cloudinaryImage'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'

const NAV_BTN =
  'flex h-9 w-9 items-center justify-center rounded-full border border-[#e8d5c0] bg-white/95 text-[#7a2c3a] shadow-sm transition hover:border-[#7a2c3a] disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10'
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%25" height="100%25" fill="%23f8f2e7"/><g fill="%237a6a58" font-family="Arial,sans-serif" text-anchor="middle"><text x="50%25" y="47%25" font-size="38">Image unavailable</text><text x="50%25" y="53%25" font-size="24">This product has no image yet</text></g></svg>'

/**
 * @param {{ product: { id?: string, name?: string, image?: string, images?: string[] }, discountPct?: number, imageUrls?: string[] }} props
 */
export default function ProductImageGallery({ product, discountPct = 0, imageUrls }) {
  const rawImages =
    Array.isArray(imageUrls) && imageUrls.length > 0
      ? imageUrls.map((u) => String(u || '').trim()).filter(Boolean)
      : getProductImages(product)
  const hasRealImages = rawImages.length > 0
  const images = hasRealImages
    ? rawImages.map((url) => productImageUrl(url, 'gallery'))
    : [FALLBACK_IMAGE]
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomOn, setZoomOn] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [brokenImages, setBrokenImages] = useState({})
  const mainPrevRef = useRef(null)
  const mainNextRef = useRef(null)
  const lbPrevRef = useRef(null)
  const lbNextRef = useRef(null)

  useEffect(() => {
    setActiveIndex(0)
    setLightboxOpen(false)
  }, [product?.id, images.join('|')])

  useEffect(() => {
    if (!lightboxOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen])

  const name = product?.name || 'Product'
  const hasMultiple = rawImages.length > 1
  const bindNav = (swiper, prevEl, nextEl) => {
    if (!swiper?.params?.navigation) return
    swiper.params.navigation.prevEl = prevEl
    swiper.params.navigation.nextEl = nextEl
    swiper.navigation.destroy()
    swiper.navigation.init()
    swiper.navigation.update()
  }

  const getImageSrc = (src) => {
    if (!src) return FALLBACK_IMAGE
    return brokenImages[src] ? FALLBACK_IMAGE : src
  }

  return (
    <>
      <div className="product-gallery min-w-0 max-w-full">
        <div className="product-gallery__frame relative w-full max-w-full overflow-hidden rounded-2xl border border-[#e8dcc8] bg-[#faf8f5] shadow-[0_8px_28px_-16px_rgba(58,21,29,0.12)]">
          {discountPct > 0 ? (
            <span className="badge-sale absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
              {discountPct}% off
            </span>
          ) : null}

          {hasMultiple ? (
            <span
              className="absolute right-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 font-playfair text-[11px] text-white sm:right-4 sm:top-4"
              aria-live="polite"
            >
              {activeIndex + 1} / {images.length}
            </span>
          ) : null}

          <Swiper
            modules={[Navigation, Thumbs, Keyboard, A11y]}
            spaceBetween={0}
            slidesPerView={1}
            keyboard={{ enabled: true }}
            navigation={hasMultiple}
            thumbs={
              hasMultiple
                ? { swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }
                : undefined
            }
            onBeforeInit={(swiper) => bindNav(swiper, mainPrevRef.current, mainNextRef.current)}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            a11y={{
              prevSlideMessage: 'Previous product image',
              nextSlideMessage: 'Next product image',
            }}
            className="product-gallery__main"
          >
            {images.map((src, index) => (
              <SwiperSlide key={`${src}-${index}`}>
                <button
                  type="button"
                  className="block w-full cursor-zoom-in text-left"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={`View ${name} image ${index + 1} full size`}
                >
                  <img
                    src={getImageSrc(src)}
                    alt={name}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : undefined}
                    onError={() => setBrokenImages((prev) => ({ ...prev, [src]: true }))}
                    onMouseEnter={() => hasRealImages && setZoomOn(true)}
                    onMouseLeave={() => setZoomOn(false)}
                    onMouseMove={(e) => {
                      if (!hasRealImages) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = ((e.clientX - rect.left) / rect.width) * 100
                      const y = ((e.clientY - rect.top) / rect.height) * 100
                      setZoomPos({
                        x: Math.max(0, Math.min(100, x)),
                        y: Math.max(0, Math.min(100, y)),
                      })
                    }}
                    className={`aspect-[4/5] w-full object-contain p-4 sm:p-6 ${
                      hasRealImages ? 'transition-transform duration-200' : ''
                    }`}
                    style={
                      hasRealImages
                        ? {
                            transform: zoomOn ? 'scale(1.35)' : 'scale(1)',
                            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                          }
                        : undefined
                    }
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

          {hasMultiple ? (
            <>
              <button
                ref={mainPrevRef}
                type="button"
                className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 ${NAV_BTN}`}
                aria-label="Previous image"
              >
                <i className="fa-solid fa-chevron-left text-xs" aria-hidden />
              </button>
              <button
                ref={mainNextRef}
                type="button"
                className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 ${NAV_BTN}`}
                aria-label="Next image"
              >
                <i className="fa-solid fa-chevron-right text-xs" aria-hidden />
              </button>
            </>
          ) : null}
        </div>

        {hasMultiple ? (
          <>
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[Thumbs]}
              watchSlidesProgress
              slidesPerView={4}
              spaceBetween={8}
              breakpoints={{
                480: { slidesPerView: 5 },
                640: { slidesPerView: 6 },
              }}
              className="product-gallery__thumbs mt-3"
            >
              {rawImages.map((rawSrc, index) => (
                <SwiperSlide key={`thumb-${rawSrc}-${index}`} className="!h-auto">
                  <div
                    className={`aspect-[4/5] w-full overflow-hidden rounded-lg border-2 bg-[#f8f2e7] ${
                      activeIndex === index
                        ? 'border-gold ring-1 ring-gold/40'
                        : 'border-transparent opacity-80'
                    }`}
                  >
                    <img
                      src={getImageSrc(productImageUrl(rawSrc, 'thumb'))}
                      alt=""
                      className="h-full w-full object-contain"
                      loading="lazy"
                      onError={() =>
                        setBrokenImages((prev) => ({
                          ...prev,
                          [productImageUrl(rawSrc, 'thumb')]: true,
                        }))
                      }
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <p className="mt-2 text-center font-playfair text-[11px] text-[#9a8578] sm:text-xs">
              Select a thumbnail · Tap image to zoom
            </p>
          </>
        ) : (
          <p className="mt-2 w-full text-center font-playfair text-[11px] text-muted sm:text-xs">
            {hasRealImages ? 'Tap image to enlarge' : 'No image uploaded yet'}
          </p>
        )}
      </div>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
        >
          <div className="mb-3 flex shrink-0 items-center justify-between text-white">
            <span className="font-playfair text-sm">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Close gallery"
            >
              <i className="fa-solid fa-xmark text-lg" aria-hidden />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <Swiper
              modules={[Navigation, Keyboard, A11y]}
              initialSlide={activeIndex}
              spaceBetween={0}
              slidesPerView={1}
              keyboard={{ enabled: true }}
              navigation={hasMultiple}
              onBeforeInit={(swiper) => bindNav(swiper, lbPrevRef.current, lbNextRef.current)}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className="product-gallery__lightbox h-full"
            >
              {rawImages.map((rawSrc, index) => {
                const lbSrc = productImageUrl(rawSrc, 'lightbox')
                return (
                  <SwiperSlide
                    key={`lb-${rawSrc}-${index}`}
                    className="flex items-center justify-center"
                  >
                    <img
                      src={getImageSrc(lbSrc)}
                      alt={`${name} — image ${index + 1}`}
                      className="max-h-[min(78vh,720px)] w-full object-contain"
                      onError={() => setBrokenImages((prev) => ({ ...prev, [lbSrc]: true }))}
                    />
                  </SwiperSlide>
                )
              })}
            </Swiper>

            {hasMultiple ? (
              <>
                <button
                  ref={lbPrevRef}
                  type="button"
                  className={`absolute left-0 top-1/2 z-10 -translate-y-1/2 ${NAV_BTN}`}
                  aria-label="Previous image"
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden />
                </button>
                <button
                  ref={lbNextRef}
                  type="button"
                  className={`absolute right-0 top-1/2 z-10 -translate-y-1/2 ${NAV_BTN}`}
                  aria-label="Next image"
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
