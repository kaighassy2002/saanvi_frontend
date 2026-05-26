import { useEffect, useRef } from 'react'

/**
 * Calls onLoadMore when the sentinel enters the viewport (with optional root margin).
 */
export function useInfiniteScroll({ onLoadMore, hasMore, isLoading, rootMargin = '200px' }) {
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!hasMore || isLoading) return undefined
    const node = sentinelRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin, threshold: 0 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore, rootMargin])

  return sentinelRef
}
