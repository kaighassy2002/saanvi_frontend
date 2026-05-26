import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createProduct,
  deleteProduct,
  getCategories,
  listProducts,
  updateProduct,
} from './services/adminApi'
import {
  formToApiBody,
  productToForm,
  validateProductForm,
} from './utils/adminProductForm'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import ProductImageUpload from './components/ProductImageUpload'

function AdminProductFormPage({ mode = 'new' }) {
  const { id } = useParams()
  const isEdit = mode === 'edit'
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(() => productToForm(null))
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const cats = await getCategories(authFetch)
      setCategories(cats)
      if (isEdit && id) {
        setLoading(true)
        const products = await listProducts(authFetch)
        const product = products.find((p) => String(p.id) === String(id))
        if (!product) {
          setError('Product not found')
        } else {
          setForm(productToForm(product))
        }
      }
    } catch (e) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [authFetch, id, isEdit])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    const errors = validateProductForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = formToApiBody(form)
      if (isEdit) {
        await updateProduct(authFetch, id, body)
        setSuccess('Product updated.')
      } else {
        await createProduct(authFetch, body)
        navigate('/admin/products', { replace: true, state: { message: 'Product created.' } })
        return
      }
    } catch (err) {
      setError(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteProduct(authFetch, id)
      navigate('/admin/products', { replace: true })
    } catch (err) {
      setError(err?.message || 'Delete failed')
      setShowDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading…</p>

  const inputClass =
    'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link to="/admin/products" className="text-sm text-muted hover:text-ink">
          ← Back to products
        </Link>
        <h1 className="font-bodoni text-2xl text-ink mt-2">
          {isEdit ? 'Edit product' : 'Add product'}
        </h1>
      </div>

      <AdminErrorBanner message={error} />
      {success ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 lux-card p-6">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Name *</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          {fieldErrors.name ? <p className="mt-1 text-xs text-red-700">{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Category *</label>
          <input
            list="admin-categories"
            className={inputClass}
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
          />
          <datalist id="admin-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {fieldErrors.category ? (
            <p className="mt-1 text-xs text-red-700">{fieldErrors.category}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Price (₹) *</label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
            />
            {fieldErrors.price ? (
              <p className="mt-1 text-xs text-red-700">{fieldErrors.price}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Compare at (₹)</label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.originalPrice}
              onChange={(e) => setField('originalPrice', e.target.value)}
            />
          </div>
        </div>

        <ProductImageUpload
          images={Array.isArray(form.images) ? form.images : []}
          authFetch={authFetch}
          error={fieldErrors.images}
          onChange={(next) => {
            setForm((prev) => ({
              ...prev,
              images: typeof next === 'function' ? next(prev.images || []) : next,
            }))
            setFieldErrors((errs) => {
              const updated = { ...errs }
              delete updated.images
              return updated
            })
          }}
        />

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Description</label>
          <textarea
            rows={4}
            className={inputClass}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>

        <fieldset className="border border-[#e8d5c0] rounded-lg p-4">
          <legend className="px-1 text-xs font-medium text-muted">Specifications</legend>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs text-muted mb-1">Material</label>
              <input
                className={inputClass}
                value={form.material}
                onChange={(e) => setField('material', e.target.value)}
                placeholder="Gold, Silver, Rose Gold, Platinum, Brass"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Colour</label>
              <input
                className={inputClass}
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
                placeholder="e.g. Rose Gold, Silver"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Weight</label>
              <input
                className={inputClass}
                value={form.weight}
                onChange={(e) => setField('weight', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Length</label>
              <input
                className={inputClass}
                value={form.length}
                onChange={(e) => setField('length', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Certification</label>
              <input
                className={inputClass}
                value={form.certification}
                onChange={(e) => setField('certification', e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Stock *</label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.stock}
              onChange={(e) => setField('stock', e.target.value)}
            />
            {fieldErrors.stock ? (
              <p className="mt-1 text-xs text-red-700">{fieldErrors.stock}</p>
            ) : null}
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setField('published', e.target.checked)}
              />
              Published on storefront
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className="lux-button px-4 py-2 text-sm">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
          {isEdit ? (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Delete product
            </button>
          ) : null}
        </div>
      </form>

      <AdminConfirmDialog
        open={showDelete}
        title="Delete product"
        message="Permanently delete this product?"
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

export default AdminProductFormPage
