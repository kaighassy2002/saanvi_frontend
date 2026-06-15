import React from 'react'
import { DEFAULT_HOME_SECTIONS } from '../../User_pages/data/homeContent'

const inputClass =
  'w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none'

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">{label}</span>
      {hint ? <span className="mt-0.5 block text-[11px] text-muted">{hint}</span> : null}
      <div className="mt-1">{children}</div>
    </label>
  )
}

function SectionBlock({ title, children }) {
  return (
    <div className="lux-card space-y-3 p-4">
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      {children}
    </div>
  )
}

function HomeSectionsEditor({ sections, onChange }) {
  const patch = (key, value) => onChange({ ...sections, [key]: value })
  const patchNested = (parent, key, value) => {
    patch(parent, { ...sections[parent], [key]: value })
  }

  const updateTab = (index, field, value) => {
    const tabs = [...(sections.trending?.tabs || [])]
    tabs[index] = { ...tabs[index], [field]: value }
    patchNested('trending', 'tabs', tabs)
  }

  const addTab = () => {
    const tabs = [...(sections.trending?.tabs || []), { id: 'featured', label: '' }]
    patchNested('trending', 'tabs', tabs)
  }

  const removeTab = (index) => {
    const tabs = (sections.trending?.tabs || []).filter((_, i) => i !== index)
    patchNested('trending', 'tabs', tabs)
  }

  const updateChip = (index, field, value) => {
    const chips = [...(sections.mobileQuickShop?.chips || [])]
    chips[index] = { ...chips[index], [field]: value }
    patchNested('mobileQuickShop', 'chips', chips)
  }

  const addChip = () => {
    const chips = [
      ...(sections.mobileQuickShop?.chips || []),
      { label: '', link: '/collections', highlight: false },
    ]
    patchNested('mobileQuickShop', 'chips', chips)
  }

  const removeChip = (index) => {
    const chips = (sections.mobileQuickShop?.chips || []).filter((_, i) => i !== index)
    patchNested('mobileQuickShop', 'chips', chips)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e8d5c0] bg-[#faf7f2] px-4 py-3 text-xs text-muted">
        Edit section headings, buttons, and mobile copy. Use <code className="font-mono">{'{{threshold}}'}</code>{' '}
        in the service bar strip for the free-shipping amount.
      </div>

      <SectionBlock title="Service bar (desktop)">
        <Field
          label="Top strip message"
          hint="Desktop only — below the hero. Use an em dash (—) to split headline and accent, e.g. Celebrate Onam with handcrafted jewellery — Shop the festive edit. Supports {{threshold}}."
        >
          <input
            className={inputClass}
            value={sections.serviceBarStrip || ''}
            placeholder={DEFAULT_HOME_SECTIONS.serviceBarStrip}
            onChange={(e) => patch('serviceBarStrip', e.target.value)}
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Promo banners (desktop headings)">
        <Field label="Overline">
          <input
            className={inputClass}
            value={sections.promo?.overline || ''}
            onChange={(e) => patchNested('promo', 'overline', e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            className={inputClass}
            value={sections.promo?.title || ''}
            onChange={(e) => patchNested('promo', 'title', e.target.value)}
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Trending products (desktop)">
        <Field label="Overline">
          <input
            className={inputClass}
            value={sections.trending?.overline || ''}
            onChange={(e) => patchNested('trending', 'overline', e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            className={inputClass}
            value={sections.trending?.title || ''}
            onChange={(e) => patchNested('trending', 'title', e.target.value)}
          />
        </Field>
        <Field label="View all link label">
          <input
            className={inputClass}
            value={sections.trending?.viewAllLabel || ''}
            onChange={(e) => patchNested('trending', 'viewAllLabel', e.target.value)}
          />
        </Field>
        <p className="text-xs font-medium text-ink">Tab labels</p>
        {(sections.trending?.tabs || []).map((tab, index) => (
          <div key={`tab-${index}`} className="flex flex-wrap items-end gap-2">
            <label className="text-[11px] text-muted">
              Tab ID
              <select
                className={`${inputClass} mt-0.5 w-36`}
                value={tab.id || 'featured'}
                onChange={(e) => updateTab(index, 'id', e.target.value)}
              >
                <option value="featured">featured</option>
                <option value="new">new</option>
                <option value="bestseller">bestseller</option>
              </select>
            </label>
            <label className="min-w-0 flex-1 text-[11px] text-muted">
              Label
              <input
                className={`${inputClass} mt-0.5`}
                value={tab.label || ''}
                onChange={(e) => updateTab(index, 'label', e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => removeTab(index)}
              className="pb-2 text-xs text-red-700 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addTab} className="text-xs text-muted hover:text-ink">
          + Add tab
        </button>
      </SectionBlock>

      <SectionBlock title="Popular categories (desktop)">
        <Field label="Overline">
          <input
            className={inputClass}
            value={sections.categories?.overline || ''}
            onChange={(e) => patchNested('categories', 'overline', e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            className={inputClass}
            value={sections.categories?.title || ''}
            onChange={(e) => patchNested('categories', 'title', e.target.value)}
          />
        </Field>
        <Field label="Button label">
          <input
            className={inputClass}
            value={sections.categories?.buttonLabel || ''}
            onChange={(e) => patchNested('categories', 'buttonLabel', e.target.value)}
          />
        </Field>
        <Field label="Button link">
          <input
            className={inputClass}
            value={sections.categories?.buttonLink || ''}
            onChange={(e) => patchNested('categories', 'buttonLink', e.target.value)}
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Mobile — promo row">
        <Field label="Title">
          <input
            className={inputClass}
            value={sections.mobilePromos?.title || ''}
            onChange={(e) => patchNested('mobilePromos', 'title', e.target.value)}
          />
        </Field>
        <Field label="See-all link label">
          <input
            className={inputClass}
            value={sections.mobilePromos?.linkLabel || ''}
            onChange={(e) => patchNested('mobilePromos', 'linkLabel', e.target.value)}
          />
        </Field>
        <Field label="See-all URL">
          <input
            className={inputClass}
            value={sections.mobilePromos?.linkUrl || ''}
            onChange={(e) => patchNested('mobilePromos', 'linkUrl', e.target.value)}
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Mobile — trending">
        <Field label="Title">
          <input
            className={inputClass}
            value={sections.mobileTrending?.title || ''}
            onChange={(e) => patchNested('mobileTrending', 'title', e.target.value)}
          />
        </Field>
        <Field label="View-all link label">
          <input
            className={inputClass}
            value={sections.mobileTrending?.linkLabel || ''}
            onChange={(e) => patchNested('mobileTrending', 'linkLabel', e.target.value)}
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Mobile — categories">
        <Field label="Section title">
          <input
            className={inputClass}
            value={sections.mobileCategories?.title || ''}
            onChange={(e) => patchNested('mobileCategories', 'title', e.target.value)}
          />
        </Field>
        <Field label="All link label">
          <input
            className={inputClass}
            value={sections.mobileCategories?.linkLabel || ''}
            onChange={(e) => patchNested('mobileCategories', 'linkLabel', e.target.value)}
          />
        </Field>
        <Field label="All link URL">
          <input
            className={inputClass}
            value={sections.mobileCategories?.linkUrl || ''}
            onChange={(e) => patchNested('mobileCategories', 'linkUrl', e.target.value)}
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Mobile — quick shop">
        <Field label="Search hint text">
          <input
            className={inputClass}
            value={sections.mobileQuickShop?.searchPlaceholder || ''}
            onChange={(e) => patchNested('mobileQuickShop', 'searchPlaceholder', e.target.value)}
          />
        </Field>
        <p className="text-xs font-medium text-ink">Pinned chips (before category chips)</p>
        {(sections.mobileQuickShop?.chips || []).map((chip, index) => (
          <div key={`chip-${index}`} className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 text-[11px] text-muted">
              Label
              <input
                className={`${inputClass} mt-0.5`}
                value={chip.label || ''}
                onChange={(e) => updateChip(index, 'label', e.target.value)}
              />
            </label>
            <label className="min-w-0 flex-1 text-[11px] text-muted">
              Link
              <input
                className={`${inputClass} mt-0.5`}
                value={chip.link || ''}
                onChange={(e) => updateChip(index, 'link', e.target.value)}
              />
            </label>
            <label className="flex items-center gap-1 pb-2 text-[11px] text-muted">
              <input
                type="checkbox"
                checked={!!chip.highlight}
                onChange={(e) => updateChip(index, 'highlight', e.target.checked)}
              />
              Highlight
            </label>
            <button
              type="button"
              onClick={() => removeChip(index)}
              className="pb-2 text-xs text-red-700 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addChip} className="text-xs text-muted hover:text-ink">
          + Add chip
        </button>
      </SectionBlock>
    </div>
  )
}

export default HomeSectionsEditor
