import { useMemo } from 'react'
import { useStoreSettings } from '../context/storeSettingsContext'
import { resolveHeroSlides } from '../services/homeMerchandising'

export function useHomeHeroSlides() {
  const { heroSlides, ready } = useStoreSettings()

  const slides = useMemo(() => resolveHeroSlides(heroSlides), [heroSlides])

  return { slides, ready }
}
