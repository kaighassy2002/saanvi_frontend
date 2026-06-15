import React, { useState } from 'react'
import { productImageUrl } from '../../utils/cloudinaryImage'
import AdminSingleImageUpload from './AdminSingleImageUpload'

const inputClass =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

export const emptyCollectionForm = () => ({
  name: '',
  slug: '',
  description: '',
  heroImage: '',
  productIds: [],
  published: true,
  sortOrder: '0',
})

function ProductPicker({ items, selectedIds, onToggle }) {
  return (
    <>
      <p className="text-xs text-muted mb-3">{selectedIds.length} product(s) selected</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No published products available.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 max-h-72 overflow-y-auto pr-1">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={`lux-card p-2 text-left transition border-2 ${
                  selected
                    ? 'border-gold bg-[#fdf6ee]'
                    : 'border-transparent hover:border-[#e8d5c0]'
                }`}
              >
                {item.image ? (
                  <img
                    src={productImageUrl(item.image, 'thumb')}
                    alt={item.name}
                    className="mb-1.5 aspect-[4/5] w-full max-h-24 rounded-md bg-[#f8f2e7] object-contain"
                  />
                ) : (
                  <div className="mb-1.5 h-16 w-full rounded-md bg-[#f4e8db]" />
                )}
                <p className="text-[10px] font-medium leading-snug text-ink line-clamp-2 sm:text-xs">
                  {item.name}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

function rowToForm(row) {
  return {
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || '',
    heroImage: row.heroImage || '',
    productIds: Array.isArray(row.productIds) ? row.productIds.map(String) : [],
    published: row.published !== false,
    sortOrder: String(row.sortOrder ?? 0),
  }
}

function buildCollectionBody(form) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    heroImage: form.heroImage.trim(),
    productIds: form.productIds,
    published: !!form.published,
    sortOrder: Number(form.sortOrder) || 0,
  }
}

function CollectionFormFields({
  form,
  setForm,
  authFetch,
  products,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
}) {
  const toggleProduct = (id) => {
    setForm((prev) => {
      const ids = prev.productIds || []
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
      return { ...prev, productIds: next }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-[#f0e6d6] pt-4">
      <input
        className={inputClass}
        placeholder="Collection name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        className={inputClass}
        placeholder="Slug (auto from name if empty)"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
      />
      <AdminSingleImageUpload
        imageUrl={form.heroImage}
        onChange={(url) => setForm({ ...form, heroImage: url })}
        authFetch={authFetch}
        purpose="hero"
        label="Hero image"
        hint="Banner image for curated collection pages."
      />
      <textarea
        className={inputClass}
        rows={3}
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <input
        className={inputClass}
        placeholder="Sort order (lower = first)"
        type="number"
        value={form.sortOrder}
        onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => setForm({ ...form, published: e.target.checked })}
        />
        Published
      </label>
      <div className="border-t border-[#f0e6d6] pt-3">
        <p className="text-xs font-medium text-muted mb-2">Products in this collection</p>
        <ProductPicker items={products} selectedIds={form.productIds} onToggle={toggleProduct} />
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={saving} className="lux-button px-4 py-2 text-sm">
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#d8c4a7] px-4 py-2 text-sm text-muted hover:bg-[#fdfaf6]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function CollectionsEditor({
  collections,
  products,
  authFetch,
  saving,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyCollectionForm())

  const closeEditor = () => {
    setEditingId(null)
    setForm(emptyCollectionForm())
  }

  const startEdit = (row) => {
    setEditingId(row.id)
    setForm(rowToForm(row))
  }

  const startNew = () => {
    setEditingId('new')
    setForm(emptyCollectionForm())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const body = buildCollectionBody(form)
    if (editingId === 'new') {
      await onCreate(body)
    } else if (editingId) {
      await onUpdate(editingId, body)
    }
    closeEditor()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e8d5c0] bg-[#faf7f2] px-4 py-3">
        <p className="text-xs text-muted">
          Curated collections group products for campaigns and seasonal edits. Set a hero image,
          pick products, and control publish order.
        </p>
      </div>

      {editingId === 'new' ? (
        <div className="lux-card p-4">
          <h3 className="admin-section-title mb-3 text-base">New collection</h3>
          <CollectionFormFields
            form={form}
            setForm={setForm}
            authFetch={authFetch}
            products={products}
            onSubmit={handleSubmit}
            onCancel={closeEditor}
            saving={saving}
            submitLabel="Create collection"
          />
        </div>
      ) : null}

      {collections.length === 0 ? (
        <p className="text-sm text-muted">No collections yet. Add one below.</p>
      ) : (
        <ul className="space-y-3">
          {collections.map((row) => {
            const isEditing = editingId === row.id
            const productCount = Array.isArray(row.productIds) ? row.productIds.length : 0
            return (
              <li key={row.id} className="lux-card overflow-hidden">
                <div className="flex gap-3 p-4">
                  {row.heroImage ? (
                    <img
                      src={productImageUrl(row.heroImage, 'hero')}
                      alt=""
                      className="h-16 w-24 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-[#f4e8db] text-[10px] text-muted">
                      No image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{row.name}</p>
                      {row.published === false ? (
                        <span className="rounded-full bg-[#f0e6d6] px-2 py-0.5 text-[10px] text-muted">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted truncate">{row.slug || '—'}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {productCount} product{productCount === 1 ? '' : 's'} · Sort: {row.sortOrder ?? 0}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => (isEditing ? closeEditor() : startEdit(row))}
                      className="rounded-lg border border-[#d8c4a7] px-2.5 py-1 text-xs font-medium text-ink hover:bg-[#fdfaf6]"
                    >
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="border-t border-[#f0e6d6] px-4 pb-4">
                    <CollectionFormFields
                      form={form}
                      setForm={setForm}
                      authFetch={authFetch}
                      products={products}
                      onSubmit={handleSubmit}
                      onCancel={closeEditor}
                      saving={saving}
                      submitLabel="Save changes"
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {editingId !== 'new' ? (
        <button
          type="button"
          onClick={startNew}
          className="w-full rounded-lg border border-dashed border-[#d8c4a7] px-4 py-2.5 text-sm text-muted hover:border-gold hover:text-ink"
        >
          + Add collection
        </button>
      ) : null}
    </div>
  )
}

export default CollectionsEditor
export { buildCollectionBody, rowToForm }
