/** FA5 → FA6 glyph renames used in stored admin/home content. */
const GLYPH_ALIASES = {
  'fa-rotate-left': 'fa-arrow-rotate-left',
  'fa-rotate-right': 'fa-arrow-rotate-right',
  'fa-remove': 'fa-xmark',
  'fa-close': 'fa-xmark',
  'fa-times': 'fa-xmark',
}

/** Glyphs that ship in Font Awesome 6 Free "regular" style. */
const REGULAR_GLYPHS = new Set([
  'fa-paper-plane',
  'fa-envelope',
  'fa-heart',
  'fa-star',
  'fa-user',
  'fa-clock',
  'fa-calendar',
  'fa-image',
  'fa-comment',
  'fa-gem',
])

/**
 * Build a full Font Awesome class string for FA 6.4 (CDN).
 * @param {string} icon - e.g. "fa-wallet" or "fa-solid fa-truck"
 */
export function formatFontAwesomeIcon(icon) {
  const raw = String(icon || '').trim()
  if (!raw) return 'fa-solid fa-circle-question'
  if (/^fa-(solid|regular|brands)\s+/.test(raw)) return raw

  const glyph = GLYPH_ALIASES[raw] || raw
  const style = REGULAR_GLYPHS.has(raw) || REGULAR_GLYPHS.has(glyph) ? 'fa-regular' : 'fa-solid'
  return `${style} ${glyph}`
}
