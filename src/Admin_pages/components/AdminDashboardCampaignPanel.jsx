import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function CampaignTab({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-campaign-tab ${active ? 'admin-campaign-tab--active' : ''}`}
    >
      {label}
    </button>
  )
}

function CampaignGroup({ group, emptyLabel }) {
  if (!group || group.configured === 0) {
    return (
      <div className="admin-campaign-empty">
        <p className="text-sm text-muted">{emptyLabel}</p>
        <Link to="/admin/merchandising" className="admin-view-all mt-3 inline-block">
          Set up in Merchandising
        </Link>
      </div>
    )
  }

  const products = Array.isArray(group.products) ? group.products : []

  return (
    <div>
      <div className="admin-campaign-summary">
        <div>
          <p className="admin-campaign-summary__label">Units sold</p>
          <p className="admin-campaign-summary__value">{group.unitsSold || 0}</p>
        </div>
        <div>
          <p className="admin-campaign-summary__label">Revenue</p>
          <p className="admin-campaign-summary__value">{formatPrice(group.revenue)}</p>
        </div>
        <div>
          <p className="admin-campaign-summary__label">Products</p>
          <p className="admin-campaign-summary__value">{group.configured}</p>
        </div>
      </div>

      {products.length ? (
        <div className="divide-y divide-[#f0e6d6] mt-3">
          {products.slice(0, 5).map((p) => (
            <Link
              key={p.productId}
              to={`/admin/products/${encodeURIComponent(p.productId)}/edit`}
              className="admin-product-row py-3"
            >
              <span className="admin-product-row__thumb">
                {p.image ? (
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-muted">—</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                <p className="text-xs text-muted">{p.qty || 0} sold</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-ink shrink-0">
                {formatPrice(p.revenue)}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted py-8 text-center">No sales for these products in this period.</p>
      )}
    </div>
  )
}

function FestivalSummary({ combined }) {
  if (!combined || combined.configured === 0) return null

  return (
    <div className="admin-campaign-summary admin-campaign-summary--festival mx-4 mb-3 rounded-lg border border-[#efe2d1] bg-[#faf7f2]">
      <div>
        <p className="admin-campaign-summary__label">Festival total units</p>
        <p className="admin-campaign-summary__value">{combined.unitsSold || 0}</p>
      </div>
      <div>
        <p className="admin-campaign-summary__label">Festival revenue</p>
        <p className="admin-campaign-summary__value">{formatPrice(combined.revenue)}</p>
      </div>
      <div>
        <p className="admin-campaign-summary__label">Campaign SKUs</p>
        <p className="admin-campaign-summary__value">{combined.configured}</p>
      </div>
    </div>
  )
}

function AdminDashboardCampaignPanel({ campaignPerformance }) {
  const [tab, setTab] = useState('newArrivals')

  if (!campaignPerformance) {
    return <p className="text-sm text-muted py-12 text-center">Campaign data unavailable.</p>
  }

  const { newArrivals, featured, combined } = campaignPerformance

  return (
    <div className="admin-campaign-panel">
      <FestivalSummary combined={combined} />
      <div className="admin-campaign-tabs">
        <CampaignTab
          active={tab === 'newArrivals'}
          onClick={() => setTab('newArrivals')}
          label="New Arrivals"
        />
        <CampaignTab
          active={tab === 'featured'}
          onClick={() => setTab('featured')}
          label="Featured"
        />
      </div>

      {tab === 'newArrivals' ? (
        <CampaignGroup
          group={newArrivals}
          emptyLabel="No new-arrival products configured yet."
        />
      ) : (
        <CampaignGroup
          group={featured}
          emptyLabel="No featured products configured yet."
        />
      )}
    </div>
  )
}

export default AdminDashboardCampaignPanel
