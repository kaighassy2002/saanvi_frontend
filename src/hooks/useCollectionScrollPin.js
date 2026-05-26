import { useCallback, useEffect, useRef, useState } from 'react'

const MOBILE_MQ = '(max-width: 1023px)'
/** Scroll Y at or below this → full header + search visible */
const TOP_EXPANDED_Y = 10
const DEFAULT_SEARCH_PAST_Y = 96

/**
 * Flipkart-style mobile collections chrome:
 * - At top: full header + search + sort/filter in page flow
 * - Past search: fixed sort/filter only; header hidden
 * - Scroll up from deep list: compact bar returns first, not full header (until near top)
 */
export function useCollectionScrollPin(searchPastY = DEFAULT_SEARCH_PAST_Y) {
  const [chrome, setChrome] = useState({
    showCompactBar: false,
    compactBarHeight: 44,
  })
  const stateRef = useRef(chrome)
  const rafRef = useRef(0)

  useEffect(() => {
    stateRef.current = chrome
  }, [chrome])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    if (!mq.matches) return undefined

    const pastY = Math.max(searchPastY, TOP_EXPANDED_Y + 40)

    const apply = () => {
      const y = window.scrollY
      const showCompactBar = y > pastY

      if (stateRef.current.showCompactBar === showCompactBar) {
        return
      }

      setChrome((c) => ({
        ...c,
        showCompactBar,
      }))
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        apply()
      })
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [searchPastY])

  const setCompactBarHeight = useCallback((h) => {
    const height = Math.round(h) || 44
    if (stateRef.current.compactBarHeight === height) return
    setChrome((c) => ({ ...c, compactBarHeight: height }))
  }, [])

  return {
    showCompactBar: chrome.showCompactBar,
    compactBarHeight: chrome.compactBarHeight,
    setCompactBarHeight,
  }
}
