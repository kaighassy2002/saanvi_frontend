import React, { useState } from 'react'
import { productImageUrl } from '../../utils/cloudinaryImage'
import AdminSingleImageUpload from './AdminSingleImageUpload'

const inputClass =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

const emptyField = () => ({ key: '', label: '', type: 'text', options: '', required: false })

export const emptyCategoryForm = () => ({
  name: '',
  slug: '',
  description: '',
  image: '',
  sortOrder: '0',
  seoTitle: '',
  seoDescription: '',
  fieldDefinitions: [],
})

function CategoryFormFields({ form, setForm, authFetch, onSubmit, onCancel, saving, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-[#f0e6d6] pt-4">
      <input
        className={inputClass}
        placeholder="Name *"
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
        imageUrl={form.image}
        onChange={(url) => setForm({ ...form, image: url })}
        authFetch={authFetch}
        purpose="category"
        label="Home category image"
        hint="Shown on the home page category grid. Uploads to Home/Jewellery/categories."
      />
      <textarea
        className={inputClass}
        rows={2}
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
      <input
        className={inputClass}
        placeholder="SEO title"
        value={form.seoTitle}
        onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
      />
      <input
        className={inputClass}
        placeholder="SEO description"
        value={form.seoDescription}
        onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
      />
      <div className="border-t border-[#f0e6d6] pt-3 space-y-2">
        <p className="text-xs font-medium text-muted">Custom product fields (optional)</p>
        {(form.fieldDefinitions || []).map((f, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded bg-[#faf7f2] p-2">
            <input
              className={inputClass}
              placeholder="key"
              value={f.key}
              onChange={(e) => {
                const next = [...form.fieldDefinitions]
                next[i] = { ...next[i], key: e.target.value }
                setForm({ ...form, fieldDefinitions: next })
              }}
            />
            <input
              className={inputClass}
              placeholder="Label"
              value={f.label}
              onChange={(e) => {
                const next = [...form.fieldDefinitions]
                next[i] = { ...next[i], label: e.target.value }
                setForm({ ...form, fieldDefinitions: next })
              }}
            />
            <select
              className={inputClass}
              value={f.type}
              onChange={(e) => {
                const next = [...form.fieldDefinitions]
                next[i] = { ...next[i], type: e.target.value }
                setForm({ ...form, fieldDefinitions: next })
              }}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
            </select>
            <input
              className={inputClass}
              placeholder="Options (comma)"
              value={f.options}
              onChange={(e) => {
                const next = [...form.fieldDefinitions]
                next[i] = { ...next[i], options: e.target.value }
                setForm({ ...form, fieldDefinitions: next })
              }}
            />
            <label className="col-span-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={f.required}
                onChange={(e) => {
                  const next = [...form.fieldDefinitions]
                  next[i] = { ...next[i], required: e.target.checked }
                  setForm({ ...form, fieldDefinitions: next })
                }}
              />
              Required
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setForm({ ...form, fieldDefinitions: [...(form.fieldDefinitions || []), emptyField()] })
          }
          className="text-xs text-muted underline"
        >
          + Add field
        </button>
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

function rowToForm(row) {
  return {
    name: row.name || '',
    slug: row.slug || '',
    description: row.description || '',
    image: row.image || '',
    sortOrder: String(row.sortOrder ?? 0),
    seoTitle: row.seoTitle || '',
    seoDescription: row.seoDescription || '',
    fieldDefinitions: Array.isArray(row.fieldDefinitions)
      ? row.fieldDefinitions.map((f) => ({
          key: f.key || '',
          label: f.label || '',
          type: f.type || 'text',
          options: Array.isArray(f.options) ? f.options.join(', ') : '',
          required: !!f.required,
        }))
      : [],
  }
}

function buildCategoryBody(form) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    image: form.image.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    seoTitle: form.seoTitle.trim(),
    seoDescription: form.seoDescription.trim(),
    fieldDefinitions: (form.fieldDefinitions || [])
      .map((f) => ({
        key: String(f.key || '').trim(),
        label: String(f.label || '').trim(),
        type: f.type || 'text',
        options: String(f.options || '')
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
        required: !!f.required,
      }))
      .filter((f) => f.key),
  }
}

function CatalogCategoriesEditor({
  categories,
  authFetch,
  saving,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyCategoryForm())

  const closeEditor = () => {
    setEditingId(null)
    setForm(emptyCategoryForm())
  }

  const startEdit = (row) => {
    setEditingId(row.id)
    setForm(rowToForm(row))
  }

  const startNew = () => {
    setEditingId('new')
    setForm(emptyCategoryForm())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const body = buildCategoryBody(form)
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
          Categories with images appear on the home page. Click <strong>Edit</strong> on any
          category to update name, image, or sort order.
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Images upload to Cloudinary:{' '}
          <span className="font-mono">Home/Jewellery/categories</span>
        </p>
      </div>

      {editingId === 'new' ? (
        <div className="lux-card p-4">
          <h3 className="mb-3 font-playfair text-sm text-ink">New category</h3>
          <CategoryFormFields
            form={form}
            setForm={setForm}
            authFetch={authFetch}
            onSubmit={handleSubmit}
            onCancel={closeEditor}
            saving={saving}
            submitLabel="Create category"
          />
        </div>
      ) : null}

      {categories.length === 0 ? (
        <p className="text-sm text-muted">No catalog categories yet. Add one below.</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((row) => {
            const isEditing = editingId === row.id
            return (
              <li key={row.id} className="lux-card overflow-hidden">
                <div className="flex gap-3 p-4">
                  {row.image ? (
                    <img
                      src={productImageUrl(row.image, 'category')}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f4e8db] text-[10px] text-muted">
                      No img
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{row.name}</p>
                    <p className="text-xs text-muted truncate">{row.slug || '—'}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      Sort: {row.sortOrder ?? 0}
                      {row.image ? ' · Home image set' : ' · No home image'}
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
                    <CategoryFormFields
                      form={form}
                      setForm={setForm}
                      authFetch={authFetch}
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
          + Add category
        </button>
      ) : null}
    </div>
  )
}

export default CatalogCategoriesEditor
export { buildCategoryBody, rowToForm }
