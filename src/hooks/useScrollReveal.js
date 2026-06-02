import { useEffect, useRef } from 'react'

/**
 * Observes the returned ref element and adds `.is-visible` once it enters
 * the viewport. Disconnects after first trigger (fire-once).
 * Respects prefers-reduced-motion — reveals immediately if motion is reduced.
 */
export function useScrollReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
