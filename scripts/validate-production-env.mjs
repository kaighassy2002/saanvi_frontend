/**
 * Fail production builds when required Vite env vars are missing or placeholders.
 * Enforced on CI/Vercel/Render or when --strict is passed.
 * Usage: node scripts/validate-production-env.mjs [--strict]
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const strict =
  process.argv.includes('--strict') ||
  process.env.CI === 'true' ||
  process.env.CI === '1' ||
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.RENDER)

if (!strict) {
  console.warn('Skipping strict production env check (not CI/deploy). Pass --strict to enforce.')
  process.exit(0)
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).trim()
    }
    out[key] = val
  }
  return out
}

const fileEnv = parseEnvFile(join(root, '.env'))
const env = { ...fileEnv, ...process.env }

const errors = []

const apiUrl = String(env.VITE_API_URL || '').trim()
if (!apiUrl) {
  errors.push('VITE_API_URL is required for production builds')
} else if (
  apiUrl.includes('localhost') ||
  apiUrl.includes('127.0.0.1') ||
  apiUrl.includes('yoursite.com') ||
  apiUrl.includes('example.com')
) {
  errors.push(`VITE_API_URL looks like a placeholder or localhost: ${apiUrl}`)
}

if (env.VITE_DEV_PROXY === 'true') {
  errors.push('VITE_DEV_PROXY must not be true in production builds')
}

const siteUrl = String(env.VITE_SITE_URL || '').trim()
if (!siteUrl) {
  errors.push('VITE_SITE_URL is required for production builds (canonical URLs, sitemap, OG tags)')
} else if (
  siteUrl.includes('yoursite.com') ||
  siteUrl.includes('example.com') ||
  siteUrl.includes('localhost')
) {
  errors.push(`VITE_SITE_URL looks like a placeholder: ${siteUrl}`)
}

const whatsapp = String(env.VITE_STORE_WHATSAPP || '').replace(/\D/g, '')
if (!whatsapp || whatsapp === '919876543210') {
  errors.push('VITE_STORE_WHATSAPP must be set to your real WhatsApp number (not the placeholder)')
}

if (errors.length) {
  console.error('Production build blocked:\n')
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  console.error('\nSet values in jewellery_frontend/.env or your CI/host environment.')
  process.exit(1)
}

console.log('Production env validation passed.')
