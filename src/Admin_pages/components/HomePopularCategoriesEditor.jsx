import React from 'react'
import AdminSingleImageUpload from './AdminSingleImageUpload'

/**
 * Edit circular category images shown in the home "Popular Categories" row.
 */
export default function HomePopularCategoriesEditor({ tiles, onChange, authFetch }) {
  const updateTile = (index, patch) => {
    onChange(tiles.map((tile, i) => (i === index ? { ...tile, ...patch } : tile)))
  }

  if (!tiles.length) {
    return <p className="text-sm text-muted">No categories found. Add shop categories first.</p>
  }

  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        These images appear in the circular &ldquo;Popular Categories&rdquo; row on the homepage.
        Upload a new image to replace the current one, then click Save section.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile, index) => (
          <div key={tile.name} className="lux-card p-4">
            <p className="mb-3 text-sm font-medium text-ink">{tile.name}</p>
            <AdminSingleImageUpload
              imageUrl={tile.image || ''}
              onChange={(url) => updateTile(index, { image: url })}
              authFetch={authFetch}
              purpose="category"
              label="Category image"
              allowUrl={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
