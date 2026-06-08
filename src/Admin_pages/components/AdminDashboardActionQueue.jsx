import React from 'react'
import { Link } from 'react-router-dom'

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function ActionCard({ count, label, description, to, preview }) {
  const hasWork = count > 0
  return (
    <Link to={to} className={`admin-action-card ${hasWork ? 'admin-action-card--active' : ''}`}>
      <div className="admin-action-card__header">
        <span className="admin-action-card__count">{count}</span>
        <span className="admin-action-card__label">{label}</span>
      </div>
      <p className="admin-action-card__desc">{description}</p>
      {hasWork && preview?.length ? (
        <ul className="admin-action-card__preview">
          {preview.map((item) => (
            <li key={item.key} className="admin-action-card__preview-item">
              {item.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-action-card__clear">{hasWork ? 'View all →' : 'All clear'}</p>
      )}
    </Link>
  )
}

function AdminDashboardActionQueue({ actionQueue }) {
  if (!actionQueue) return null

  const { ordersToConfirm = 0, pendingReviews = 0, lowStockSkus = 0, preview = {} } = actionQueue

  const orderPreview = (preview.orders || []).slice(0, 3).map((o) => ({
    key: o.id,
    text: `${o.customerName} · ${formatPrice(o.total)}`,
  }))

  const reviewPreview = (preview.reviews || []).slice(0, 3).map((r) => ({
    key: r.id,
    text: `${r.customerName} · ${r.rating}★`,
  }))

  const stockPreview = (preview.lowStock || []).slice(0, 3).map((item) => ({
    key: `${item.productId}-${item.variantName || 'base'}`,
    text: `${item.name}${item.variantName ? ` (${item.variantName})` : ''} · ${item.stock} left`,
  }))

  const totalTasks = ordersToConfirm + pendingReviews + lowStockSkus

  return (
    <section className="admin-action-queue admin-panel mb-4">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">Today&apos;s Work</h2>
          <p className="text-xs text-muted mt-0.5">
            {totalTasks > 0
              ? `${totalTasks} item${totalTasks === 1 ? '' : 's'} need your attention`
              : 'You are all caught up for now'}
          </p>
        </div>
      </div>
      <div className="admin-action-queue__grid">
        <ActionCard
          count={ordersToConfirm}
          label="Confirm orders"
          description="New orders waiting for confirmation before packing."
          to="/admin/orders?status=Placed"
          preview={orderPreview}
        />
        <ActionCard
          count={pendingReviews}
          label="Approve reviews"
          description="Customer reviews pending moderation."
          to="/admin/reviews?status=pending"
          preview={reviewPreview}
        />
        <ActionCard
          count={lowStockSkus}
          label="Restock SKUs"
          description="SKUs at or below threshold (available = on hand minus reserved)."
          to="/admin/inventory"
          preview={stockPreview}
        />
      </div>
    </section>
  )
}

export default AdminDashboardActionQueue
