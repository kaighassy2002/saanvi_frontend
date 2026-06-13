import { useEffect } from 'react'

const SCRIPT_ATTR = 'data-structured-data'

function upsertJsonLd(id, payload) {
  const existing = document.querySelector(`script[${SCRIPT_ATTR}="${id}"]`)
  const el = existing || document.createElement('script')
  el.type = 'application/ld+json'
  el.setAttribute(SCRIPT_ATTR, id)
  el.textContent = JSON.stringify(payload)
  if (!existing) document.head.appendChild(el)
}

function removeJsonLd(id) {
  const el = document.querySelector(`script[${SCRIPT_ATTR}="${id}"]`)
  if (el) el.remove()
}

/**
 * Injects JSON-LD into document head; removed on unmount or when payload is null.
 * @param {string} id
 * @param {object | null | undefined} payload
 */
export function useStructuredData(id, payload) {
  useEffect(() => {
    if (!payload) {
      removeJsonLd(id)
      return undefined
    }
    upsertJsonLd(id, payload)
    return () => removeJsonLd(id)
  }, [id, payload])
}
