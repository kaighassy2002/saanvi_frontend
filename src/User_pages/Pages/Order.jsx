import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import PageIntro from '../Components/PageIntro'
import SiteHeader from '../Components/SiteHeader'
import {
  CUSTOMER_SESSION_CHANGED_EVENT,
  STOREFRONT_ORDERS_UPDATED_EVENT,
  STORAGE_KEYS,
  USE_LOCAL_API,
} from '../../services/config'
import { fetchMyOrders } from '../../services/storefrontOrderService'

function Order() {
  const [searchParams, setSearchParams] = useSearchParams()
  const placedId = searchParams.get('placed')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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
        { replace: true }
      )
    }, 8000)
    return () => clearTimeout(t)
  }, [placedId, setSearchParams])

  const sorted = useMemo(
    () => [...orders].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [orders]
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800'
      case 'In Transit':
        return 'bg-blue-100 text-blue-800'
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-[#f6ecee] text-[#5a1f2b]'
    }
  }

  const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem(STORAGE_KEYS.customerToken)
  const showSignInHint = !USE_LOCAL_API && !hasToken && sorted.length === 0 && !placedId

  if (loading) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="section-container py-14 text-center font-playfair text-muted">Loading orders…</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <div className="section-container py-10 sm:py-14">
        <PageIntro
          eyebrow="Order History"
          title="My Orders"
          subtitle="Track your purchases and revisit your favorite SAANVI pieces."
          stats={[
            { label: 'Orders', value: String(sorted.length) },
            { label: 'Latest', value: sorted[0] ? new Date(sorted[0].date).toLocaleDateString('en-IN') : '—' },
          ]}
        />

        {loadError ? (
          <p className="mx-auto mb-6 max-w-lg rounded-xl bg-red-50 px-4 py-2 text-center font-playfair text-sm text-red-800">
            {loadError}{' '}
            <button type="button" className="underline" onClick={() => load()}>
              Retry
            </button>
          </p>
        ) : null}

        {placedId ? (
          <div className="lux-card mb-8 border border-gold/40 bg-[#fffaf3] px-5 py-4 text-center font-playfair text-ink">
            Thank you! Order <span className="font-semibold text-[#7a2c3a]">{placedId}</span> was placed
            successfully. It appears below with status <strong>Processing</strong>
            {!USE_LOCAL_API && hasToken ? '' : !USE_LOCAL_API ? ' after you sign in with the same account.' : '.'}
          </div>
        ) : null}

        {showSignInHint ? (
          <p className="mx-auto mb-6 max-w-xl text-center text-sm text-muted">
            Sign in to see orders linked to your account. Guest checkout still saves your order on the server;
            use the same email when you register to see history here.
          </p>
        ) : null}

        {sorted.length === 0 ? (
          <div className="lux-card py-16 text-center sm:py-20">
            <div className="mb-6 sm:mb-8">
              <i className="fas fa-shopping-bag text-6xl text-[#c9b7a1]"></i>
            </div>
            <h2 className="card-heading mb-3 sm:mb-4">No orders yet</h2>
            <p className="mb-6 px-4 text-helper sm:mb-8">Start shopping to see your orders here</p>
            <Link to="/collections" className="lux-button">
              Start Shopping
            </Link>
            {!USE_LOCAL_API && !hasToken ? (
              <Link to="/auth" className="ml-3 inline-block font-playfair text-sm text-[#7a2c3a] underline">
                Sign in
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {sorted.map((order) => (
              <div
                key={order.id}
                className="lux-card p-5 transition-shadow hover:shadow-lg sm:p-6"
              >
                <div className="mb-5 flex flex-col border-b pb-5 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
                  <div>
                    <h2 className="card-title mb-2">Order #{order.id}</h2>
                    <p className="text-helper">
                      Placed on{' '}
                      {new Date(order.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <span
                      className={`inline-block rounded-full px-4 py-2 font-playfair text-sm ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="mb-5 space-y-3 sm:mb-6 sm:space-y-4">
                  {(order.items || []).map((item, index) => {
                    const lineTotal = (item.price || 0) * (item.quantity || 1)
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl bg-beige p-3 sm:gap-4 sm:p-4"
                      >
                        <img
                          src={item.image}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="card-title mb-1 text-base sm:text-lg">{item.name}</p>
                          <p className="text-sm text-muted sm:text-base">Quantity: {item.quantity}</p>
                        </div>
                        <div className="shrink-0 font-playfair text-lg text-gold sm:text-xl">
                          ₹{lineTotal.toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                  <div>
                    <span className="text-sm text-muted sm:text-base">Total Amount: </span>
                    <span className="text-price">
                      ₹{Number(order.total).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <Link
                      to={`/product/${order.items?.[0]?.productId ?? ''}`}
                      className="button-tertiary rounded-lg sm:px-6"
                    >
                      View item
                    </Link>
                    {order.status === 'Delivered' ? (
                      <Link to="/collections" className="lux-button text-sm sm:text-base">
                        Shop again
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Order
