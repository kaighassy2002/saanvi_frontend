import { useEffect } from 'react'
import { SITE_URL, STORE_NAME } from '../services/storefrontConstants'

const DEFAULT_TITLE = STORE_NAME
const DEFAULT_DESCRIPTION =
  'Shop handcrafted jewellery at Aashmika Designs — necklaces, earrings, rings and more. COD and secure online payment. Ships across India.'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(attr, key) {
  const el = document.querySelector(`meta[${attr}="${key}"]`)
  if (el) el.remove()
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function removeLink(rel) {
  const el = document.querySelector(`link[rel="${rel}"]`)
  if (el) el.remove()
}

/**
 * @param {{
 *   title?: string,
 *   description?: string,
 *   image?: string,
 *   canonicalPath?: string,
 *   ogType?: string,
 *   noIndex?: boolean,
 * }} options
 */
export function usePageMeta({
  title,
  description,
  image,
  canonicalPath,
  ogType = 'website',
  noIndex = false,
} = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${STORE_NAME}` : DEFAULT_TITLE
    const pageDescription = description || DEFAULT_DESCRIPTION
    const canonicalUrl = canonicalPath
      ? `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
      : null

    document.title = pageTitle
    upsertMeta('name', 'description', pageDescription)
    upsertMeta('property', 'og:title', pageTitle)
    upsertMeta('property', 'og:description', pageDescription)
    upsertMeta('property', 'og:site_name', STORE_NAME)
    upsertMeta('property', 'og:type', ogType)

    if (canonicalUrl) {
      upsertLink('canonical', canonicalUrl)
      upsertMeta('property', 'og:url', canonicalUrl)
    } else {
      removeLink('canonical')
      removeMeta('property', 'og:url')
    }

    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:card', 'summary_large_image')
      upsertMeta('name', 'twitter:image', image)
    } else {
      removeMeta('property', 'og:image')
      removeMeta('name', 'twitter:image')
      upsertMeta('name', 'twitter:card', 'summary')
    }

    if (noIndex) {
      upsertMeta('name', 'robots', 'noindex, nofollow')
    } else {
      removeMeta('name', 'robots')
    }

    return () => {
      document.title = DEFAULT_TITLE
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION)
      upsertMeta('property', 'og:title', DEFAULT_TITLE)
      upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION)
      upsertMeta('property', 'og:type', 'website')
      removeLink('canonical')
      removeMeta('property', 'og:url')
      removeMeta('name', 'robots')
    }
  }, [title, description, image, canonicalPath, ogType, noIndex])
}
