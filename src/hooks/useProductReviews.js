import { useCallback, useEffect, useState } from 'react'
import { REVIEWS_UPDATED_EVENT } from '../services/config'
import { fetchProductReviews, submitProductReview } from '../services/reviewService'

export function useProductReviews(productId) {
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({ average: 0, count: 0 })
  const [myReview, setMyReview] = useState(null)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!productId) return
    setError(null)
    try {
      const data = await fetchProductReviews(productId)
      setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
      setSummary(data?.summary || { average: 0, count: 0 })
      setMyReview(data?.myReview || null)
      setHasPurchased(Boolean(data?.hasPurchased))
      setCanReview(Boolean(data?.canReview))
    } catch (e) {
      setError(e?.message || 'Could not load reviews')
      setReviews([])
      setSummary({ average: 0, count: 0 })
      setMyReview(null)
      setHasPurchased(false)
      setCanReview(false)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    const onUpdate = () => load()
    window.addEventListener(REVIEWS_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(REVIEWS_UPDATED_EVENT, onUpdate)
  }, [load])

  const submit = useCallback(
    async (payload) => {
      setSubmitting(true)
      setError(null)
      try {
        await submitProductReview(productId, payload)
        await load()
        return true
      } catch (e) {
        setError(e?.message || 'Could not submit review')
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [productId, load]
  )

  return {
    reviews,
    summary,
    myReview,
    hasPurchased,
    canReview,
    loading,
    submitting,
    error,
    submit,
    refresh: load,
  }
}
