import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import AccountSidebar from '../Components/AccountSidebar'
import OrderInvoicePrint from '../Components/OrderInvoicePrint'
import OrderDetailPanel from '../Components/OrderDetailPanel'
import {
  CUSTOMER_SESSION_CHANGED_EVENT,
  STOREFRONT_ORDERS_UPDATED_EVENT,
  STORAGE_KEYS,
  USE_LOCAL_API,
} from '../../services/config'
import { whatsappUrl, STORE_NAME } from '../../services/storefrontConstants'
import { productImageUrl } from '../../utils/cloudinaryImage'
import { printOrderInvoice } from '../../utils/printOrderInvoice'
import { fetchMyOrders, fetchMyOrderById } from '../../services/storefrontOrderService'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'
import {
  formatOrderDateTime,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  getOrderPublicId,
  orderStatusIcon,
  orderStatusNote,
  orderStatusTone,
} from '../../services/orderWorkflow'
import '../Styles/user-profile.css'
import '../Styles/orders-list.css'

function formatStatusWhen(order) {
  return formatOrderDateTime(order.placedAt || order.date)
}

/** Short id for narrow screens; full id available via title attribute. */
function formatOrderId(id) {
  const s = String(id || '').trim()
  if (!s) return '—'
  if (s.length <= 18) return s
  const parts = s.split('-').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]}-…-${parts[parts.length - 1]}`
  }
  return `${s.slice(0, 10)}…${s.slice(-6)}`
}

function orderIdsMatch(a, b) {
  const left = String(a || '').trim()
  const right = String(b || '').trim()
  return left.length > 0 && left === right
}


function Order() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const placedId = searchParams.get('placed')
  const orderFromQuery = searchParams.get('order')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [expandedId, setExpandedId] = useState(() => {
    const seed = placedId || orderFromQuery
    return seed ? String(seed).trim() : null
  })
  const [fetchedExpandedOrder, setFetchedExpandedOrder] = useState(null)

  useEffect(() => {
    if (USE_LOCAL_API) return
    if (!isCustomerLoggedIn()) {
      navigate(`/auth?redirect=${encodeURIComponent('/orders')}`, { replace: true })
    }
  }, [navigate])

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const list = await fetchMyOrders()
      setOrders(list)
    } catch (e) {
      setLoadError(e?.message || 'Could not load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onSession = () => load()
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, onSession)
    if (USE_LOCAL_API) {
      window.addEventListener(STOREFRONT_ORDERS_UPDATED_EVENT, onSession)
    }
    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, onSession)
      if (USE_LOCAL_API) {
        window.removeEventListener(STOREFRONT_ORDERS_UPDATED_EVENT, onSession)
      }
    }
  }, [load])

  useEffect(() => {
    if (!placedId) return
    const t = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('placed')
          return next
        },
        { replace: true },
      )
    }, 8000)
    return () => clearTimeout(t)
  }, [placedId, setSearchParams])

  const sorted = useMemo(
    () =>
      [...orders].sort((a, b) =>
        String(b.placedAt || b.date).localeCompare(String(a.placedAt || a.date)),
      ),
    [orders],
  )

  const placedOrder = placedId
    ? sorted.find((o) => orderIdsMatch(getOrderPublicId(o), placedId))
    : null
  const listExpandedOrder = expandedId
    ? sorted.find((o) => orderIdsMatch(getOrderPublicId(o), expandedId))
    : null
  const expandedOrder =
    listExpandedOrder ||
    (fetchedExpandedOrder && expandedId && orderIdsMatch(getOrderPublicId(fetchedExpandedOrder), expandedId)
      ? fetchedExpandedOrder
      : null) ||
    (expandedId && placedOrder && orderIdsMatch(getOrderPublicId(placedOrder), expandedId) ? placedOrder : null)
  const invoiceOrder = expandedOrder || placedOrder
  const expandedOrderId = expandedOrder ? getOrderPublicId(expandedOrder) : ''

  useEffect(() => {
    if (!expandedId) {
      setFetchedExpandedOrder(null)
      return undefined
    }
    if (listExpandedOrder) {
      setFetchedExpandedOrder(null)
      return undefined
    }
    let cancelled = false
    fetchMyOrderById(expandedId)
      .then((row) => {
        if (!cancelled) setFetchedExpandedOrder(row)
      })
      .catch(() => {
        if (!cancelled) setFetchedExpandedOrder(null)
      })
    return () => {
      cancelled = true
    }
  }, [expandedId, listExpandedOrder])

  useEffect(() => {
    if (placedId) setExpandedId(String(placedId).trim())
    else if (orderFromQuery) setExpandedId(String(orderFromQuery).trim())
  }, [placedId, orderFromQuery])

  useEffect(() => {
    if (!expandedId) return
    const el = document.getElementById(`order-expand-${expandedId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [expandedId, expandedOrderId])

  const handleOrderUpdated = (updated) => {
    const id = getOrderPublicId(updated)
    if (!id) return
    setOrders((prev) => prev.map((o) => (orderIdsMatch(getOrderPublicId(o), id) ? { ...o, ...updated, id } : o)))
    if (orderIdsMatch(expandedId, id)) {
      setFetchedExpandedOrder((prev) => (prev ? { ...prev, ...updated, id } : prev))
    }
  }

  const toggleExpand = (orderId) => {
    const id = String(orderId || '').trim()
    if (!id) return
    setExpandedId((prev) => (orderIdsMatch(prev, id) ? null : id))
  }

  const hasToken =
    typeof localStorage !== 'undefined' && !!localStorage.getItem(STORAGE_KEYS.customerToken)
  const showSignInHint = !USE_LOCAL_API && !hasToken && sorted.length === 0 && !placedId

  const mainContent = loading ? (
    <div className="orders-loading" aria-busy="true" aria-label="Loading orders">
      <div className="orders-skeleton" />
      <div className="orders-skeleton" />
      <div className="orders-skeleton" />
    </div>
  ) : (
    <>
      {loadError ? (
        <p className="orders-alert orders-alert--error" role="alert">
          {loadError}{' '}
          <button type="button" className="underline" onClick={() => load()}>
            Retry
          </button>
        </p>
      ) : null}

      {placedId ? (
        <div className="orders-banner orders-banner--success" role="status">
          <h2 className="orders-banner__title">Order placed successfully</h2>
          <p className="orders-banner__text">
            Order <span className="orders-banner__id">{placedId}</span> was placed successfully
            {placedOrder ? (
              <>
                {' '}
                with status <strong>{placedOrder.status}</strong>
              </>
            ) : (
              '.'
            )}
            {!USE_LOCAL_API && !hasToken ? ' Sign in with the same account to track it.' : null}
          </p>
          <p className="orders-banner__text">
            {placedOrder ? (
              <>
                <button
                  type="button"
                  className="font-semibold underline text-royal-700"
                  onClick={() => setExpandedId(placedId)}
                >
                  View details
                </button>
                {' · '}
                <button
                  type="button"
                  className="font-semibold underline text-royal-700"
                  onClick={() => printOrderInvoice(placedId)}
                >
                  Download invoice
                </button>
              </>
            ) : (
              'Your order will appear in the list below shortly.'
            )}
          </p>
          <a
            href={whatsappUrl(`Hi, I placed order ${placedId} on ${STORE_NAME}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="orders-banner__whatsapp"
          >
            <i className="fab fa-whatsapp" aria-hidden />
            Chat on WhatsApp
          </a>
        </div>
      ) : null}

      {showSignInHint ? (
        <p className="orders-alert orders-alert--info">
          Sign in to see orders linked to your account.{' '}
          <Link to="/auth" className="font-semibold text-royal-700 underline">
            Sign in
          </Link>
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty__icon" aria-hidden>
            <i className="fa-solid fa-bag-shopping" />
          </div>
          <h2 className="orders-empty__title">No orders yet</h2>
          <p className="orders-empty__text">
            When you place an order, it appears here with live status updates and quick links to each
            piece.
          </p>
          <div className="orders-empty__actions">
            <Link to="/collections" className="lux-button text-sm py-2.5 px-5">
              Start shopping
            </Link>
            {!USE_LOCAL_API && !hasToken ? (
              <Link to="/auth" className="button-tertiary text-sm">
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <ul className="orders-list">
          {sorted.map((order) => {
            const orderId = getOrderPublicId(order)
            const items = order.items || []
            const status = order.status || 'Placed'
            const tone = orderStatusTone(status)
            const payment = formatPaymentMethodLabel(order.paymentMethod)
            const statusNote = orderStatusNote(status)
            const showReview = status === 'Delivered'

            const isExpanded = orderIdsMatch(expandedId, orderId)

            return (
              <li key={orderId}>
                <article className={`order-card${isExpanded ? ' order-card--expanded' : ''}`}>
                  <header className="order-card__status">
                    <div className="order-card__status-main">
                      <span
                        className={`order-card__status-icon order-card__status-icon--${tone}`}
                        aria-hidden
                      >
                        <i className={orderStatusIcon(status)} />
                      </span>
                      <div className="order-card__status-text">
                        <p className={`order-card__status-label order-card__status-label--${tone}`}>
                          {status}
                        </p>
                        <p className="order-card__status-date">{formatStatusWhen(order)}</p>
                      </div>
                    </div>
                    <p className="order-card__order-id" title={orderId}>
                      Order #{formatOrderId(orderId)}
                    </p>
                  </header>

                  <div className="order-card__body">
                    {items.map((item, index) => {
                      const productId = item.productId
                      const qty = item.quantity || 1
                      const lineTotal = (item.price || 0) * qty
                      const sizeLabel = item.size ? `Size: ${item.size}` : null
                      const metaParts = [
                        sizeLabel,
                        `Qty: ${qty}`,
                        `₹${lineTotal.toLocaleString('en-IN')}`,
                      ].filter(Boolean)

                      const productRow = (
                        <>
                          <img
                            src={productImageUrl(item.image, 'thumb')}
                            alt={item.name || 'Ordered item'}
                            className="order-card__thumb"
                            loading="lazy"
                          />
                          <div className="order-card__info">
                            <p className="order-card__brand">{STORE_NAME}</p>
                            <p className="order-card__title">{item.name}</p>
                            <p className="order-card__meta">{metaParts.join(' · ')}</p>
                          </div>
                          <i className="fa-solid fa-chevron-right order-card__chevron" aria-hidden />
                        </>
                      )

                      return (
                        <div key={`${orderId}-${index}`} className="order-card__item">
                          {productId ? (
                            <Link to={`/product/${productId}`} className="order-card__product">
                              {productRow}
                            </Link>
                          ) : (
                            <div className="order-card__product">{productRow}</div>
                          )}

                          {statusNote && index === 0 ? (
                            <p className="order-card__note">
                              <i className="fa-solid fa-circle-info order-card__note-icon" aria-hidden />
                              {statusNote}
                            </p>
                          ) : null}

                          {showReview && productId ? (
                            <div className="order-card__review">
                              <span className="order-card__review-label">
                                Review this piece as a verified buyer
                              </span>
                              <span className="order-card__review-stars" aria-hidden>
                                <i className="fa-regular fa-star" />
                                <i className="fa-regular fa-star" />
                                <i className="fa-regular fa-star" />
                                <i className="fa-regular fa-star" />
                                <i className="fa-regular fa-star" />
                              </span>
                              <Link
                                to={`/product/${productId}#reviews`}
                                className="order-card__review-cta"
                              >
                                Write review
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  <footer className="order-card__foot">
                    <span className="order-card__total">
                      Order total: ₹{Number(order.total).toLocaleString('en-IN')}
                      {payment ? ` · ${payment}` : ''}
                      {` · Payment ${formatPaymentStatusLabel(order.paymentStatus)}`}
                    </span>
                    <div className="order-card__foot-actions">
                      <button
                        type="button"
                        className={`order-card__foot-link${isExpanded ? ' order-card__foot-link--active' : ''}`}
                        onClick={() => toggleExpand(orderId)}
                        aria-expanded={isExpanded}
                        aria-controls={`order-expand-${orderId}`}
                      >
                        {isExpanded ? 'Hide details' : 'View details'}
                      </button>
                      {status === 'Delivered' ? (
                        <Link to="/collections" className="order-card__foot-link">
                          Shop again
                        </Link>
                      ) : (
                        <a
                          href={whatsappUrl(`Hi, I have a question about order ${orderId}.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-card__foot-link"
                        >
                          Need help?
                        </a>
                      )}
                    </div>
                  </footer>

                  {isExpanded ? (
                    <OrderDetailPanel
                      order={expandedOrder && orderIdsMatch(getOrderPublicId(expandedOrder), orderId) ? expandedOrder : order}
                      onOrderUpdated={handleOrderUpdated}
                      onClose={() => setExpandedId(null)}
                    />
                  ) : null}
                </article>
              </li>
            )
          })}
        </ul>
      )}

      {expandedId && !listExpandedOrder && fetchedExpandedOrder && orderIdsMatch(getOrderPublicId(fetchedExpandedOrder), expandedId) ? (
        <article className="order-card order-card--expanded orders-orphan-detail">
          <OrderDetailPanel
            order={fetchedExpandedOrder}
            onOrderUpdated={handleOrderUpdated}
            onClose={() => setExpandedId(null)}
          />
        </article>
      ) : null}
    </>
  )

  return (
    <div id="main-content" className="page-shell" tabIndex={-1}>
      {invoiceOrder ? (
        <OrderInvoicePrint
          order={invoiceOrder}
          shipping={invoiceOrder.shipping || {}}
          items={invoiceOrder.items || []}
        />
      ) : null}
      <SiteHeader />

      <div className="account-page orders-page section-container">
        <header className="account-page__hero orders-page__hero">
          <div className="orders-page__hero-copy">
            <p className="text-kicker orders-page__kicker">Account</p>
            <h1 className="account-page__hero-title">Your orders</h1>
            <p className="account-page__hero-sub orders-page__hero-sub">
              Track delivery and revisit pieces you love.
            </p>
          </div>
          <div className="account-page__hero-actions orders-page__hero-actions">
            <Link to="/profile" className="account-page__hero-link">
              <i className="fa-solid fa-user text-xs" aria-hidden />
              Profile
            </Link>
            <Link to="/collections" className="account-page__hero-link">
              <i className="fa-solid fa-gem text-xs" aria-hidden />
              Shop
            </Link>
          </div>
        </header>

        <nav className="account-tabs-mobile orders-page__tabs lg:hidden" aria-label="Account shortcuts">
          <Link to="/profile" className="account-tabs-mobile__btn">
            Profile
          </Link>
          <Link to="/profile?tab=addresses" className="account-tabs-mobile__btn">
            Addresses
          </Link>
          <span className="account-tabs-mobile__btn account-tabs-mobile__btn--active">Orders</span>
        </nav>

        <div className="account-layout">
          <AccountSidebar active="orders" />
          <div className="orders-page__content">{mainContent}</div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Order
