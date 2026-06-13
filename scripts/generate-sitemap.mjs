/**
 * Fetches dynamic sitemap from the API and writes public/sitemap.xml before production build.
 * Set VITE_API_URL (or SITEMAP_API_URL) to your backend origin without trailing slash.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'sitemap.xml')

const apiBase = String(process.env.SITEMAP_API_URL || process.env.VITE_API_URL || '').replace(/\/$/, '')
const fallbackBase =
  String(process.env.VITE_SITE_URL || process.env.STOREFRONT_URL || '').replace(/\/$/, '') ||
  'https://www.aashmikadesigns.com'

function staticFallbackXml() {
  const pages = ['/', '/collections', '/contact', '/shipping', '/returns', '/privacy-policy']
  const body = pages
    .map(
      (path) => `  <url>
    <loc>${fallbackBase}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

async function main() {
  let xml = staticFallbackXml()

  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/api/sitemap.xml`, {
        headers: { Accept: 'application/xml' },
      })
      if (res.ok) {
        const text = await res.text()
        if (text.includes('<urlset')) {
          xml = text.endsWith('\n') ? text : `${text}\n`
          console.log(`[sitemap] wrote dynamic sitemap from ${apiBase}/api/sitemap.xml`)
        }
      } else {
        console.warn(`[sitemap] API returned ${res.status}; using static fallback`)
      }
    } catch (err) {
      console.warn(`[sitemap] fetch failed (${err.message}); using static fallback`)
    }
  } else {
    console.warn('[sitemap] no VITE_API_URL — wrote static fallback (no product URLs)')
  }

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, xml, 'utf8')
}

main()
