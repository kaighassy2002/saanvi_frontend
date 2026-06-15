import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getCategories,
  getProduct,
  listSizeCharts,
  updateProduct,
} from './services/adminApi'
import {
  formToApiBody,
  productToForm,
  validateProductForm,
} from './utils/adminProductForm'
import {
  getPresetFieldsForCategory,
  getSubcategoriesForCategory,
} from './utils/categoryAttributePresets'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import ProductImageUpload from './components/ProductImageUpload'
import ProductVariantsSection from './components/ProductVariantsSection'

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const ic =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors'

const labelCls = 'block text-xs font-medium text-muted mb-1'
const sectionCls = 'bg-white rounded-xl border border-[#e8d5c0] shadow-sm overflow-hidden'
const sectionHeadCls =
  'flex items-center gap-2.5 px-5 py-4 border-b border-[#f0e6d6] bg-[#fdfaf6]'
const sectionBodyCls = 'p-5'

function SectionIcon({ icon }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f7ecee] text-[#7a2c3a] text-sm">
      {icon}
    </span>
  )
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className={sectionHeadCls}>
      <SectionIcon icon={icon} />
      <div>
        <p className="admin-body font-semibold leading-tight">{title}</p>
        {subtitle ? <p className="text-[11px] text-muted mt-0.5">{subtitle}</p> : null}
      </div>
    </div>
  )
}

function Field({ label, error, required, hint, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function ToggleSwitch({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer select-none items-start gap-2.5">
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#7a2c3a]' : 'bg-[#d8c4a7]'}`}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
      <span>
        <span className="text-sm text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-muted">{hint}</span> : null}
      </span>
    </label>
  )
}

function Badge({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f7ecee] border border-[#e8cfd0] px-2.5 py-0.5 text-xs font-medium text-[#7a2c3a]">
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} className="ml-0.5 text-[#7a2c3a]/60 hover:text-[#7a2c3a]">
          ×
        </button>
      ) : null}
    </span>
  )
}

function TagsInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const tags = value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const add = () => {
    const t = input.trim()
    if (!t) return
    const next = [...new Set([...tags, t])].join(', ')
    onChange(next)
    setInput('')
  }

  const remove = (tag) => {
    const next = tags.filter((t) => t !== tag).join(', ')
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <Badge key={t} onRemove={() => remove(t)}>
            {t}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className={ic}
          value={input}
          placeholder={placeholder || 'Type and press Add'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-lg border border-[#d8c4a7] px-3 py-2 text-xs hover:bg-[#f7ecee] transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ─── Section components ───────────────────────────────────────────────────────

function PublishSection({ form, setField, fieldErrors = {} }) {
  const scheduled = Boolean(form.publishAt)
  const scheduledFuture =
    scheduled && new Date(form.publishAt).getTime() > Date.now()

  return (
    <div id="section-publish" className={sectionCls}>
      <SectionTitle icon="◉" title="Publish" subtitle="Draft, schedule, pricing, and inventory" />
      <div className={`${sectionBodyCls} space-y-6`}>
        <div>
          <p className="mb-3 text-xs font-medium text-muted">Visibility</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
            <ToggleSwitch
              checked={!!form.published && !scheduledFuture}
              onChange={(v) => {
                setField('published', v)
                if (v) setField('publishAt', '')
              }}
              label="Visible on storefront"
              hint="Turn off to save as draft"
            />
            <ToggleSwitch
              checked={!!form.featured}
              onChange={(v) => setField('featured', v)}
              label="Featured product"
              hint="Highlight on home and merchandising picks"
            />
          </div>
        </div>

        <Field
          label="Schedule publish"
          hint="Product stays draft until this date/time — useful for festival launches"
        >
          <input
            type="datetime-local"
            className={ic}
            value={form.publishAt || ''}
            onChange={(e) => {
              setField('publishAt', e.target.value)
              if (e.target.value) setField('published', false)
            }}
          />
          {scheduledFuture ? (
            <p className="mt-1.5 text-[11px] text-[#9f7a2c]">
              Scheduled — will auto-publish on{' '}
              {new Date(form.publishAt).toLocaleString('en-IN')}
            </p>
          ) : null}
        </Field>

        <PricingSection form={form} setField={setField} fieldErrors={fieldErrors} embedded />
        <ShippingSection form={form} setField={setField} />
      </div>
    </div>
  )
}

function BasicInfoSection({ form, setField, fieldErrors, categories, sizeCharts = [] }) {
  const subcategories = getSubcategoriesForCategory(form.category)
  const categoryOptions = useMemo(() => {
    const set = new Set(categories.filter(Boolean))
    if (form.category) set.add(form.category)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [categories, form.category])

  return (
    <div id="section-basic" className={sectionCls}>
      <SectionTitle icon="✦" title="Basic information" subtitle="Name, category, and identifiers" />
      <div className={sectionBodyCls}>
        <div className="space-y-4">
          <Field label="Product name" required error={fieldErrors.name}>
            <input
              className={ic}
              value={form.name}
              placeholder="e.g. Heritage Gold Kundan Bangle Set"
              onChange={(e) => setField('name', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SKU / product code" hint="Leave blank to auto-generate">
              <input
                className={ic}
                value={form.sku}
                placeholder="e.g. ASD-BNGL-001"
                onChange={(e) => setField('sku', e.target.value)}
              />
            </Field>
            <Field label="Category" required error={fieldErrors.category}>
              <select
                className={ic}
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              >
                <option value="">Select a category</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Subcategory"
              hint={
                subcategories.length
                  ? `Suggested: ${subcategories.slice(0, 4).join(', ')}`
                  : 'Optional — e.g. Choker, Studs, Kada'
              }
            >
              {subcategories.length > 0 ? (
                <input
                  list="admin-subcat-list"
                  className={ic}
                  value={form.subcategory}
                  placeholder="Select or type"
                  onChange={(e) => setField('subcategory', e.target.value)}
                />
              ) : (
                <input
                  className={ic}
                  value={form.subcategory}
                  placeholder="e.g. Choker, Studs, Kada"
                  onChange={(e) => setField('subcategory', e.target.value)}
                />
              )}
              {subcategories.length > 0 ? (
                <datalist id="admin-subcat-list">
                  {subcategories.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              ) : null}
            </Field>
            <Field label="Tags" hint="For filtering and collections — not shown to search engines">
              <TagsInput
                value={form.tags}
                onChange={(v) => setField('tags', v)}
                placeholder="e.g. festive, kundan, wedding"
              />
            </Field>
          </div>

          <Field label="Size chart" hint="Shown on product page for rings, bangles, etc.">
            <select
              className={ic}
              value={form.sizeChartId || ''}
              onChange={(e) => setField('sizeChartId', e.target.value)}
            >
              <option value="">None</option>
              {sizeCharts.map((chart) => (
                <option key={chart.id} value={chart.id}>
                  {chart.name} ({chart.type})
                </option>
              ))}
            </select>
            {sizeCharts.length === 0 ? (
              <p className="mt-1 text-[11px] text-muted">
                <Link to="/admin/size-charts" className="text-[#7a2c3a] hover:underline">
                  Create size charts
                </Link>{' '}
                first.
              </p>
            ) : null}
          </Field>
        </div>
      </div>
    </div>
  )
}

function MediaSection({ form, setField, fieldErrors, authFetch }) {
  if (form.hasVariants || form.hasColorVariants) {
    const firstMeta = (Array.isArray(form.variants) ? form.variants[0]?.imagesMeta : []) || []
    const count = firstMeta.filter((m) => m?.url).length
    return (
      <div id="section-media" className={sectionCls}>
        <SectionTitle
          icon="⬡"
          title="Product images"
          subtitle="Managed per colour — see Colours section"
        />
        <div className={sectionBodyCls}>
          <div className="rounded-lg border border-[#e8d5c0] bg-[#fdfaf6] px-4 py-4 text-xs text-muted leading-relaxed">
            <p>
              This product uses <strong>multiple colours</strong>. Upload each colour&apos;s image set under{' '}
              <strong>Colours</strong> (below Images in the sidebar).
            </p>
            <p className="mt-2">
              The <strong>first colour&apos;s gallery</strong> ({count} image{count === 1 ? '' : 's'} currently)
              becomes the listing thumbnail in collections.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="section-media" className={sectionCls}>
      <SectionTitle icon="⬡" title="Product Images" subtitle="First image is used as the main thumbnail" />
      <div className={sectionBodyCls}>
        <ProductImageUpload
          imagesMeta={Array.isArray(form.imagesMeta) ? form.imagesMeta : []}
          authFetch={authFetch}
          error={fieldErrors.images}
          onChange={(next) => {
            const value = typeof next === 'function' ? next(form.imagesMeta || []) : next
            setField('imagesMeta', value)
          }}
        />
      </div>
    </div>
  )
}

function PricingSection({ form, setField, fieldErrors, embedded = false }) {
  const price = Number(form.price)
  const orig = Number(form.originalPrice)
  const discountPct =
    orig > price && orig > 0 && Number.isFinite(price)
      ? Math.round(((orig - price) / orig) * 100)
      : null

  const inner = (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Selling price (₹)" required error={fieldErrors.price}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={ic}
                value={form.price}
                placeholder="0.00"
                onChange={(e) => setField('price', e.target.value)}
              />
            </Field>
            <Field
              label="Original price (₹)"
              error={fieldErrors.originalPrice}
              hint="Optional — shown crossed out when higher than selling price"
            >
              <input
                type="number"
                min="0"
                step="0.01"
                className={ic}
                value={form.originalPrice}
                placeholder="Leave empty if no discount"
                onChange={(e) => setField('originalPrice', e.target.value)}
              />
              {discountPct != null ? (
                <p className="mt-1.5 text-[11px] text-[#5a6b52]">
                  Storefront will show ~{discountPct}% off
                </p>
              ) : null}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Stock quantity"
              required
              error={fieldErrors.stock}
              hint={
                form.hasVariants || form.hasColorVariants
                  ? 'Use 0 here if stock is tracked in the variant matrix below'
                  : undefined
              }
            >
              <input
                type="number"
                min="0"
                className={ic}
                value={form.stock}
                onChange={(e) => setField('stock', e.target.value)}
              />
            </Field>
            <Field label="Low stock alert" hint="Inventory warning when stock reaches this level">
              <input
                type="number"
                min="0"
                className={ic}
                value={form.lowStockThreshold}
                onChange={(e) => setField('lowStockThreshold', e.target.value)}
              />
            </Field>
          </div>
        </div>
  )

  if (embedded) return inner

  return (
    <div id="section-pricing" className={sectionCls}>
      <SectionTitle icon="₹" title="Pricing & inventory" subtitle="Selling price and stock" />
      <div className={sectionBodyCls}>{inner}</div>
    </div>
  )
}

function ProductDetailsSection({ form, setField }) {
  return (
    <div id="section-details" className={sectionCls}>
      <SectionTitle
        icon="◈"
        title="Description & details"
        subtitle="Copy and specifications shown on the product page"
      />
      <div className={sectionBodyCls}>
        <div className="space-y-6">
          <div className="space-y-4">
            <Field label="Short description" hint="Listing cards and search (1–2 sentences)">
              <textarea
                rows={2}
                className={ic}
                value={form.shortDescription}
                placeholder="Concise selling point…"
                onChange={(e) => setField('shortDescription', e.target.value)}
              />
            </Field>
            <Field label="Full description" hint="Product detail page">
              <textarea
                rows={5}
                className={ic}
                value={form.description}
                placeholder="Craftsmanship, materials, occasion…"
                onChange={(e) => setField('description', e.target.value)}
              />
            </Field>
          </div>

          <div className="border-t border-[#f0e6d6] pt-5">
            <p className="mb-3 text-xs font-medium text-muted">Jewellery specifications</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Material" hint="Used in filters and spec table">
                <input
                  className={ic}
                  value={form.material}
                  placeholder="e.g. 22K Gold, Sterling Silver"
                  onChange={(e) => setField('material', e.target.value)}
                />
              </Field>
              {!form.hasVariants && !form.hasColorVariants ? (
                <Field label="Colour" hint="Single-colour product only">
                  <input
                    className={ic}
                    value={form.color}
                    placeholder="e.g. Rose Gold, Antique Gold"
                    onChange={(e) => setField('color', e.target.value)}
                  />
                </Field>
              ) : null}
              <Field label="Jewellery weight" hint="Piece weight — e.g. 12g, 5.5g">
                <input
                  className={ic}
                  value={form.weight}
                  placeholder="e.g. 12g"
                  onChange={(e) => setField('weight', e.target.value)}
                />
              </Field>
              <Field label="Wear length" hint="Chain, necklace, or bracelet length — not box size">
                <input
                  className={ic}
                  value={form.length}
                  placeholder='e.g. 18", 45 cm'
                  onChange={(e) => setField('length', e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-[#f0e6d6] pt-5">
            <p className="mb-1 text-xs font-medium text-muted">Product dimensions (optional)</p>
            <p className="mb-3 text-[11px] text-muted">Physical size of the piece — L × W × H</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Length">
                <input
                  className={ic}
                  value={form.dimensionsLength}
                  placeholder="–"
                  onChange={(e) => setField('dimensionsLength', e.target.value)}
                />
              </Field>
              <Field label="Width">
                <input
                  className={ic}
                  value={form.dimensionsWidth}
                  placeholder="–"
                  onChange={(e) => setField('dimensionsWidth', e.target.value)}
                />
              </Field>
              <Field label="Height">
                <input
                  className={ic}
                  value={form.dimensionsHeight}
                  placeholder="–"
                  onChange={(e) => setField('dimensionsHeight', e.target.value)}
                />
              </Field>
              <Field label="Unit">
                <select
                  className={ic}
                  value={form.dimensionsUnit}
                  onChange={(e) => setField('dimensionsUnit', e.target.value)}
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="in">inches</option>
                </select>
              </Field>
            </div>
          </div>

          {!form.hasVariants && !form.hasColorVariants ? (
            <div className="border-t border-[#f0e6d6] pt-5">
              <Field
                label="Available sizes"
                hint="Comma-separated — for simple products without the variant matrix"
              >
                <input
                  className={ic}
                  value={form.sizeOptions}
                  placeholder="e.g. 2.2, 2.4, 2.6 or 6, 7, 8"
                  onChange={(e) => setField('sizeOptions', e.target.value)}
                />
                {form.sizeOptions ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.sizeOptions
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                  </div>
                ) : null}
              </Field>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SeoSection({ form, setField }) {
  const titleLen = String(form.seoTitle || form.name || '').length
  const descLen = String(form.seoDescription || '').length

  return (
    <div className="space-y-4">
          <Field
            label="SEO title"
            hint={`${titleLen}/60 characters · Leave blank to use product name`}
          >
            <input
              className={ic}
              value={form.seoTitle}
              placeholder={form.name || 'Product page title for search engines'}
              onChange={(e) => setField('seoTitle', e.target.value)}
              maxLength={60}
            />
          </Field>
          <Field
            label="Meta description"
            hint={`${descLen}/160 characters · Shown in search result snippets`}
          >
            <textarea
              rows={3}
              className={ic}
              value={form.seoDescription}
              placeholder="Compelling 1–2 sentence description for search engines…"
              maxLength={160}
              onChange={(e) => setField('seoDescription', e.target.value)}
            />
          </Field>
          <Field label="SEO keywords" hint="For search engines only — separate from product tags">
            <TagsInput
              value={form.seoKeywords}
              onChange={(v) => setField('seoKeywords', v)}
              placeholder="e.g. gold bangle, bridal jewellery"
            />
          </Field>

          {(form.seoTitle || form.name) || form.seoDescription ? (
            <div className="rounded-lg border border-[#e8d5c0] p-3 bg-white">
              <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">Search preview</p>
              <p className="text-blue-700 text-sm font-medium leading-snug truncate">
                {form.seoTitle || form.name || 'Product title'}
              </p>
              <p className="text-green-700 text-[11px] mt-0.5">
                aashmikadesigns.com/products/…
              </p>
              <p className="text-[#555] text-xs mt-1 line-clamp-2">
                {form.seoDescription || 'Add a meta description to improve your search snippet.'}
              </p>
            </div>
          ) : null}
    </div>
  )
}

function ShippingSection({ form, setField }) {
  return (
    <div className="space-y-4 border-t border-[#f0e6d6] pt-5">
      <p className="text-xs font-medium text-muted">Shipping (optional)</p>
      <p className="text-[11px] text-muted">
        Checkout uses store-wide shipping rules. These fields are saved for future courier integration.
      </p>
      <ToggleSwitch
        checked={!!form.freeShipping}
        onChange={(v) => setField('freeShipping', v)}
        label="Mark as free shipping"
        hint="Not applied at checkout yet"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Package weight" hint="For courier — e.g. 250g, 0.5kg">
          <input
            className={ic}
            value={form.shippingWeight}
            placeholder="250g"
            onChange={(e) => setField('shippingWeight', e.target.value)}
          />
        </Field>
        <Field label="Dimension unit">
          <select
            className={ic}
            value={form.shippingUnit}
            onChange={(e) => setField('shippingUnit', e.target.value)}
          >
            <option value="cm">cm</option>
            <option value="mm">mm</option>
            <option value="in">inches</option>
          </select>
        </Field>
      </div>
      <div>
        <p className="mb-2 text-[11px] text-muted">Package box size (L × W × H)</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Length">
            <input
              className={ic}
              value={form.shippingLength}
              placeholder="–"
              onChange={(e) => setField('shippingLength', e.target.value)}
            />
          </Field>
          <Field label="Width">
            <input
              className={ic}
              value={form.shippingWidth}
              placeholder="–"
              onChange={(e) => setField('shippingWidth', e.target.value)}
            />
          </Field>
          <Field label="Height">
            <input
              className={ic}
              value={form.shippingHeight}
              placeholder="–"
              onChange={(e) => setField('shippingHeight', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function SeoTabSection({ form, setField }) {
  const presetFields = getPresetFieldsForCategory(form.category)
  const customAttributes = Array.isArray(form.customAttributes) ? form.customAttributes : []

  const addPresetAttribute = (field) => {
    if (customAttributes.some((row) => String(row?.key || '') === field.key)) return
    setField('customAttributes', [...customAttributes, { key: field.key, value: '' }])
  }

  const addAttribute = () => {
    setField('customAttributes', [...customAttributes, { key: '', value: '' }])
  }

  const updateAttribute = (index, k, v) => {
    setField(
      'customAttributes',
      customAttributes.map((row, i) => (i === index ? { ...row, [k]: v } : row))
    )
  }

  const removeAttribute = (index) => {
    setField('customAttributes', customAttributes.filter((_, i) => i !== index))
  }

  return (
    <div id="section-seo" className={sectionCls}>
      <SectionTitle icon="⚙" title="SEO & attributes" subtitle="Search engines and extra product details" />
      <div className={`${sectionBodyCls} space-y-6`}>
        <SeoSection form={form} setField={setField} />
        {presetFields.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted">
              Suggested for <span className="font-semibold text-[#7a2c3a]">{form.category}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {presetFields.map((field) => {
                const exists = customAttributes.some((r) => r.key === field.key)
                return (
                  <button
                    key={field.key}
                    type="button"
                    disabled={exists}
                    onClick={() => addPresetAttribute(field)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      exists
                        ? 'cursor-default border-[#e8d5c0] bg-[#f8f2e7] text-muted opacity-60'
                        : 'border-[#d8c4a7] bg-white text-ink hover:bg-[#f7ecee]'
                    }`}
                  >
                    {exists ? '✓' : '+'} {field.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Extra attributes</p>
            <button
              type="button"
              onClick={addAttribute}
              className="rounded-lg border border-[#d8c4a7] bg-white px-3 py-1.5 text-xs hover:bg-[#f7ecee]"
            >
              + Add field
            </button>
          </div>
          {customAttributes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#e8d5c0] py-4 text-center text-xs text-muted">
              Optional custom spec fields
            </p>
          ) : (
            <div className="space-y-2">
              {customAttributes.map((row, index) => {
                const preset = presetFields.find((f) => f.key === row.key)
                return (
                  <div key={index} className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-2">
                    <input
                      className={ic}
                      value={row.key}
                      placeholder="Field name"
                      onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                    />
                    {preset?.type === 'select' ? (
                      <select
                        className={ic}
                        value={row.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      >
                        <option value="">Select…</option>
                        {preset.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={ic}
                        value={row.value}
                        placeholder={preset?.placeholder || 'Value'}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="rounded-lg border border-red-100 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50"
                      aria-label="Remove attribute"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const FORM_TABS = [
  { id: 'basics', label: 'Basics' },
  { id: 'media', label: 'Media' },
  { id: 'variants', label: 'Variants' },
  { id: 'seo', label: 'SEO' },
  { id: 'publish', label: 'Publish' },
]

function ProductFormTabs({ active, onChange }) {
  return (
    <nav className="sticky top-0 z-20 -mx-1 mb-5 border-b border-[#e8d5c0] bg-[#faf7f2]/95 px-1 pt-1 backdrop-blur-sm">
      <div className="flex gap-1 overflow-x-auto pb-0">
        {FORM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-t-lg border px-4 py-2.5 text-xs font-medium transition-colors ${
              active === tab.id
                ? 'border-[#e8d5c0] border-b-white bg-white text-[#7a2c3a]'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AdminProductFormPage({ mode = 'new' }) {
  const { id } = useParams()
  const isEdit = mode === 'edit'
  const { authFetch } = useAdminAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)

  const [form, setFormState] = useState(() => productToForm(null))
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('basics')
  const [sizeCharts, setSizeCharts] = useState([])
  const [duplicating, setDuplicating] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [cats, charts] = await Promise.all([
        getCategories(authFetch),
        listSizeCharts(authFetch),
      ])
      setCategories(cats)
      setSizeCharts(charts)
      if (isEdit && id) {
        setLoading(true)
        try {
          const product = await getProduct(authFetch, id)
          setFormState(productToForm(product))
        } catch {
          setError('Product not found')
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

  const setField = useCallback((key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    const errors = validateProductForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // scroll to first error
      const firstErrorKey = Object.keys(errors)[0]
      const firstErrorEl = formRef.current?.querySelector(`[data-field="${firstErrorKey}"]`)
      if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = formToApiBody(form)
      if (isEdit) {
        await updateProduct(authFetch, id, body)
        setSuccess('Product updated successfully.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        await createProduct(authFetch, body)
        navigate('/admin/products', { replace: true, state: { message: 'Product created.' } })
        return
      }
    } catch (err) {
      setError(err?.message || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async () => {
    if (!isEdit || !id) return
    setDuplicating(true)
    setError('')
    try {
      const copy = await duplicateProduct(authFetch, id)
      navigate(`/admin/products/${encodeURIComponent(copy.id)}/edit`, {
        state: { message: 'Product duplicated as draft.' },
      })
    } catch (err) {
      setError(err?.message || 'Duplicate failed')
    } finally {
      setDuplicating(false)
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

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted text-sm">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Loading product…
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-2">
            ← Products
          </Link>
          <h1 className="admin-page-title">
            {isEdit ? 'Edit product' : 'Add new product'}
          </h1>
          {isEdit ? (
            <p className="admin-page-lead">
              ID: <code className="rounded bg-[#f0e6d6] px-1 font-mono text-xs">{id}</code>
            </p>
          ) : (
            <p className="admin-page-lead">Fill in the details below to list a new product on the storefront.</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="lux-button px-4 py-2 text-sm disabled:opacity-60"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Saving…
              </span>
            ) : isEdit ? 'Save changes' : 'Create product'}
          </button>
          {isEdit ? (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating}
                className="rounded-lg border border-[#d8c4a7] px-4 py-2 text-sm hover:bg-[#f7ecee] transition-colors disabled:opacity-60"
              >
                {duplicating ? 'Duplicating…' : 'Duplicate'}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Banners ── */}
      <AdminErrorBanner message={error} />
      {success ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          <span className="text-emerald-600">✓</span>
          {success}
        </div>
      ) : null}

      {/* ── Layout ── */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <ProductFormTabs active={activeTab} onChange={setActiveTab} />

        <div className="min-w-0 space-y-5">
          {activeTab === 'basics' ? (
            <>
              <BasicInfoSection
                form={form}
                setField={setField}
                fieldErrors={fieldErrors}
                categories={categories}
                sizeCharts={sizeCharts}
              />
              <ProductDetailsSection form={form} setField={setField} />
            </>
          ) : null}

          {activeTab === 'media' ? (
            <MediaSection form={form} setField={setField} fieldErrors={fieldErrors} authFetch={authFetch} />
          ) : null}

          {activeTab === 'variants' ? (
            <ProductVariantsSection
              form={form}
              setField={setField}
              fieldErrors={fieldErrors}
              authFetch={authFetch}
            />
          ) : null}

          {activeTab === 'seo' ? (
            <SeoTabSection form={form} setField={setField} />
          ) : null}

          {activeTab === 'publish' ? (
            <PublishSection form={form} setField={setField} fieldErrors={fieldErrors} />
          ) : null}

          {/* ── Bottom action bar ── */}
          <div className="rounded-xl border border-[#e8d5c0] bg-white px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted hidden sm:block">
              {isEdit ? 'Changes are saved to the database immediately.' : 'Product will be saved and can be edited at any time.'}
            </p>
            <div className="flex gap-3 ml-auto">
              <Link
                to="/admin/products"
                className="rounded-lg border border-[#d8c4a7] px-4 py-2 text-sm text-muted hover:bg-[#fdfaf6] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="lux-button px-5 py-2 text-sm disabled:opacity-60"
              >
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <AdminConfirmDialog
        open={showDelete}
        title="Delete product"
        message={`Permanently delete "${form.name || 'this product'}"? This cannot be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

export default AdminProductFormPage
