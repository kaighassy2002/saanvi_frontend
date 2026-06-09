import { useMemo } from 'react'
import { useStoreSettings } from '../context/storeSettingsContext'
import {
  applyHomeTemplate,
  resolveHomeSections,
  resolveHomeServices,
  resolvePromoBanners,
} from '../services/homeMerchandising'

/** Storefront hook — CMS content with fallbacks and {{threshold}} tokens. */
export function useHomeContent() {
  const {
    promoBanners,
    homeServices,
    homeSections,
    freeShippingThreshold,
    ready,
  } = useStoreSettings()

  const templateCtx = useMemo(
    () => ({ freeShippingThreshold }),
    [freeShippingThreshold]
  )

  const sections = useMemo(
    () => resolveHomeSections(homeSections),
    [homeSections]
  )

  const banners = useMemo(() => resolvePromoBanners(promoBanners), [promoBanners])

  const services = useMemo(() => {
    return resolveHomeServices(homeServices).map((item) => ({
      ...item,
      text: applyHomeTemplate(item.text, templateCtx),
    }))
  }, [homeServices, templateCtx])

  const serviceBarStrip = useMemo(
    () => applyHomeTemplate(sections.serviceBarStrip, templateCtx),
    [sections.serviceBarStrip, templateCtx]
  )

  return {
    ready,
    promoBanners: banners,
    homeServices: services,
    homeSections: sections,
    serviceBarStrip,
    freeShippingThreshold,
  }
}
