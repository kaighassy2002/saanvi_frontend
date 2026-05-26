import { useEffect, useMemo, useState } from 'react'
import { REVIEWS_UPDATED_EVENT } from '../services/config'
import { fetchReviewSummaries } from '../services/reviewService'

export function useReviewSummaries(productIds) {
  const key = useMemo(() => [...new Set(productIds.map(String).filter(Boolean))].sort().join(','), [productIds])
  const [summaries, setSummaries] = useState({})

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (!ids.length) {
      setSummaries({})
      return undefined
    }
    let cancelled = false
    fetchReviewSummaries(ids).then((data) => {
      if (!cancelled) setSummaries(data || {})
    })
    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    const reload = () => {
      const ids = key ? key.split(',') : []
      if (!ids.length) return
      fetchReviewSummaries(ids).then(setSummaries)
    }
    window.addEventListener(REVIEWS_UPDATED_EVENT, reload)
    return () => window.removeEventListener(REVIEWS_UPDATED_EVENT, reload)
  }, [key])

  return summaries
}
