import { applyHomeTemplate } from './homeMerchandising'

export const DEFAULT_ANNOUNCEMENT_MESSAGE = 'Free shipping on orders above {{threshold}}'
export const DEFAULT_ANNOUNCEMENT_LINK_LABEL = 'Shop now'
export const DEFAULT_ANNOUNCEMENT_LINK_URL = '/collections'

/** Resolve storefront announcement bar from store settings (with legacy fallbacks). */
export function resolveAnnouncementBar(settings = {}) {
  const enabled = settings.announcementEnabled !== false
  if (!enabled) {
    return { enabled: false, extraMessage: '', message: '', linkLabel: '', linkUrl: '', showIcon: false }
  }

  const threshold = Number(settings.freeShippingThreshold) || 0
  const templateCtx = { freeShippingThreshold: threshold }

  const extraMessage = applyHomeTemplate(
    String(settings.announcementExtraMessage || '').trim(),
    templateCtx
  )

  const customMessage = String(settings.announcementMessage || '').trim()
  const message = applyHomeTemplate(customMessage || DEFAULT_ANNOUNCEMENT_MESSAGE, templateCtx)

  const hasLinkLabelField = Object.prototype.hasOwnProperty.call(settings, 'announcementLinkLabel')
  let linkLabel = hasLinkLabelField
    ? String(settings.announcementLinkLabel || '').trim()
    : customMessage
      ? ''
      : DEFAULT_ANNOUNCEMENT_LINK_LABEL

  const linkUrl =
    String(settings.announcementLinkUrl || '').trim() || DEFAULT_ANNOUNCEMENT_LINK_URL

  const hasShowIconField = Object.prototype.hasOwnProperty.call(settings, 'announcementShowIcon')
  const showIcon = hasShowIconField ? settings.announcementShowIcon !== false : true

  return {
    enabled: true,
    extraMessage,
    message,
    linkLabel,
    linkUrl,
    showIcon,
  }
}
