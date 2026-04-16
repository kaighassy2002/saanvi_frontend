import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  adminFetchCategories,
  adminFetchProducts,
  adminSaveProduct,
} from '../services/catalogService'
import { normalizeProduct } from '../services/localCatalog'

const emptySpec = { material: '', weight: '', length: '', certification: '' }

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    image: '',
    description: '',
    published: true,
    stock: '10',
    specifications: { ...emptySpec },
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cats = await adminFetchCategories()
        if (!cancelled) setCategories(cats)
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await adminFetchProducts()
        const found = list.find((p) => p.id === Number(id) || String(p.id) === String(id))
        if (!cancelled && found) {
          const n = normalizeProduct(found)
          setForm({
            name: n.name,
            category: n.category,
            price: String(n.price),
            originalPrice: String(n.originalPrice),
            image: n.image,
            description: n.description,
            published: n.published !== false,
            stock: String(n.stock),
            specifications: { ...emptySpec, ...n.specifications },
          })
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateSpec(key, value) {
    setForm((f) => ({
      ...f,
      specifications: { ...f.specifications, [key]: value },
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        id: isNew ? undefined : id,
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        image: form.image.trim(),
        images: form.image.trim() ? [form.image.trim()] : [],
        description: form.description.trim(),
        published: form.published,
        stock: Number(form.stock),
        specifications: form.specifications,
      }
      await adminSaveProduct(payload)
      navigate('/admin/products')
    } catch (err) {
      setError(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="font-playfair text-muted">Loading…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/admin/products" className="font-playfair text-sm text-muted hover:text-[#7a2c3a]">
          ← Products
        </Link>
        <h2 className="font-bodoni text-3xl text-ink">{isNew ? 'New product' : 'Edit product'}</h2>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 font-playfair text-sm text-red-800">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="lux-card space-y-5 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="form-label">Name</label>
            <input
              className="royal-input"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Category</label>
            <input
              className="royal-input"
              list="admin-cat-suggestions"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              required
            />
            <datalist id="admin-cat-suggestions">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="form-label">Stock</label>
            <input
              type="number"
              min={0}
              className="royal-input"
              value={form.stock}
              onChange={(e) => updateField('stock', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Price (₹)</label>
            <input
              type="number"
              min={0}
              className="royal-input"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Original / compare price (₹)</label>
            <input
              type="number"
              min={0}
              className="royal-input"
              value={form.originalPrice}
              onChange={(e) => updateField('originalPrice', e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Image URL</label>
            <input
              className="royal-input"
              value={form.image}
              onChange={(e) => updateField('image', e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea
              className="royal-input min-h-[100px] resize-y"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#eadfc9] p-4">
          <p className="mb-3 font-playfair text-sm font-semibold text-ink">Specifications</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {['material', 'weight', 'length', 'certification'].map((key) => (
              <div key={key}>
                <label className="form-label capitalize">{key}</label>
                <input
                  className="royal-input"
                  value={form.specifications[key] || ''}
                  onChange={(e) => updateSpec(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 font-playfair text-sm text-ink">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => updateField('published', e.target.checked)}
          />
          Published on storefront
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className="lux-button">
            {saving ? 'Saving…' : 'Save product'}
          </button>
          <Link to="/admin/products" className="lux-button-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
