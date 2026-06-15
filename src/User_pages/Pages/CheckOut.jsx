import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutSteps from '../Components/CheckoutSteps'
import Footer from '../Components/Footer'
import FreeShippingProgress from '../Components/FreeShippingProgress'
import SiteHeader from '../Components/SiteHeader'
import TrustStrip from '../Components/TrustStrip'
import { useCart } from '../../hooks/useCart'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'
import { STORAGE_KEYS, USE_LOCAL_API } from '../../services/config'
import { validateCartStockForCheckout } from '../../services/checkoutStock'
import { placeStorefrontOrder } from '../../services/storefrontOrderService'
import { fetchSavedAddressesFromServer, readSavedAddresses } from '../../services/savedAddresses'
import { fetchRazorpayConfig, quoteCheckoutOrder, quoteCoupon } from '../../services/jewelleryApi'
import { payWithRazorpay } from '../../services/razorpayCheckout'
import {
  isRazorpayCheckoutMethod,
  PAYMENT_COD,
  PAYMENT_RAZORPAY,
} from '../../services/paymentMethods'
import { useStoreSettings } from '../../context/storeSettingsContext'
import { useStoreProfile } from '../../hooks/useStoreProfile'
import { productImageUrl } from '../../utils/cloudinaryImage'
import '../Styles/checkout-page.css'

function readCustomerProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customerProfile)
    if (!raw) return null
    const p = JSON.parse(raw)
    return p && typeof p === 'object' ? p : null
  } catch {
    return null
  }
}

function mergeShippingFromSaved(addr, profile) {
  const digits = (v) => String(v || '').replace(/\D/g, '')
  return {
    firstName: String(addr.firstName || profile?.firstName || '').trim(),
    lastName: String(addr.lastName || profile?.lastName || '').trim(),
    email: String(profile?.email || '').trim(),
    phone: digits(addr.phone) || digits(profile?.phone) || '',
    address: String(addr.address || '').trim(),
    city: String(addr.city || '').trim(),
    state: String(addr.state || '').trim(),
    pincode: String(addr.pincode || '').trim(),
  }
}

function validateCheckout(data) {
  const err = {}
  if (!data.firstName.trim()) err.firstName = 'Required'
  if (!data.lastName.trim()) err.lastName = 'Required'
  if (!data.email.trim()) err.email = 'Required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) err.email = 'Invalid email'
  const digits = data.phone.replace(/\D/g, '')
  if (!digits) err.phone = 'Required'
  else if (!/^[6-9]\d{9}$/.test(digits)) err.phone = 'Enter a valid 10-digit mobile number'
  if (!data.address.trim()) err.address = 'Required'
  if (!data.city.trim()) err.city = 'Required'
  if (!data.state.trim()) err.state = 'Required'
  if (!data.pincode.trim()) err.pincode = 'Required'
  else if (!/^\d{6}$/.test(data.pincode.trim())) err.pincode = '6-digit pincode'
  return err
}

function CheckoutField({
  id,
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  as: Tag = 'input',
  className = '',
  ...rest
}) {
  const inputClass = [
    'royal-input',
    error ? 'checkout-page__input--error' : '',
    Tag === 'textarea' ? 'resize-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <Tag
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type={Tag === 'input' ? type : undefined}
        className={inputClass}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? <p className="mt-1 font-playfair text-xs text-red-700">{error}</p> : null}
    </div>
  )
}

function CheckOut() {
  const navigate = useNavigate()
  const { items, totals, clearCart } = useCart()
  const { codEnabled } = useStoreSettings()
  const { whatsappUrl } = useStoreProfile()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: PAYMENT_COD,
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savedAddressList, setSavedAddressList] = useState([])
  const [selectedSavedId, setSelectedSavedId] = useState('new')
  const [razorpayEnabled, setRazorpayEnabled] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponBusy, setCouponBusy] = useState(false)
  const [couponError, setCouponError] = useState('')

  const orderItems = useMemo(
    () =>
      items.map((i) => ({
        productId: i.productId,
        variantName: i.variantKey || i.variantName || undefined,
        variantKey: i.variantKey || i.variantName || undefined,
        name: i.name,
        image: i.image,
        quantity: i.quantity,
        price: i.price,
      })),
    [items]
  )

  const checkoutTotals = useMemo(() => {
    if (appliedCoupon?.code) {
      return {
        subtotal: appliedCoupon.subtotal ?? totals.subtotal,
        shipping: appliedCoupon.shippingFee ?? totals.shipping,
        tax: totals.tax,
        couponDiscount: appliedCoupon.discount || 0,
        total: appliedCoupon.total,
      }
    }
    return {
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      couponDiscount: 0,
      total: totals.total,
    }
  }, [totals, appliedCoupon])

  useEffect(() => {
    setAppliedCoupon(null)
    setCouponError('')
  }, [items])

  useEffect(() => {
    if (USE_LOCAL_API) return
    let active = true
    fetchRazorpayConfig().then((cfg) => {
      if (!active) return
      const enabled = Boolean(cfg?.enabled)
      setRazorpayEnabled(enabled)
      setFormData((prev) => {
        if (!codEnabled && enabled) return { ...prev, paymentMethod: PAYMENT_RAZORPAY }
        return prev
      })
    })
    return () => {
      active = false
    }
  }, [codEnabled])

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code) {
      setCouponError('Enter a coupon code')
      return
    }
    if (USE_LOCAL_API) {
      setCouponError('Coupons require the live store API')
      return
    }
    setCouponBusy(true)
    setCouponError('')
    try {
      const data = await quoteCoupon({ code, items: orderItems })
      if (!data?.valid) {
        throw new Error(data?.message || 'Invalid coupon')
      }
      setAppliedCoupon(data)
    } catch (err) {
      setAppliedCoupon(null)
      setCouponError(err?.message || 'Could not apply coupon')
    } finally {
      setCouponBusy(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      navigate(`/auth?redirect=${encodeURIComponent('/checkout')}`, { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!isCustomerLoggedIn()) return
    if (items.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [items.length, navigate])

  useEffect(() => {
    let active = true
    async function initSavedAddresses() {
      const list = USE_LOCAL_API ? readSavedAddresses() : await fetchSavedAddressesFromServer()
      if (!active) return
      setSavedAddressList(list)
      const profile = readCustomerProfile()
      setFormData((prev) => {
        const withProfile = {
          ...prev,
          email: profile?.email?.trim() || prev.email,
          firstName: String(profile?.firstName || '').trim() || prev.firstName,
          lastName: String(profile?.lastName || '').trim() || prev.lastName,
          phone: String(profile?.phone || '')
            .replace(/\D/g, '')
            .slice(0, 10) || prev.phone,
        }
        if (list.length === 0) {
          return withProfile
        }
        const addr = list[0]
        const merged = mergeShippingFromSaved(addr, profile)
        return {
          ...withProfile,
          ...merged,
          paymentMethod: prev.paymentMethod,
        }
      })
      setSelectedSavedId(list.length > 0 ? list[0].id : 'new')
    }
    initSavedAddresses()
    return () => {
      active = false
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (
      name !== 'paymentMethod' &&
      ['firstName', 'lastName', 'phone', 'address', 'city', 'state', 'pincode'].includes(name)
    ) {
      setSelectedSavedId('new')
    }
  }

  const pickSavedAddress = (id) => {
    const profile = readCustomerProfile()
    if (id === 'new') {
      setSelectedSavedId('new')
      setFormData((prev) => ({
        ...prev,
        firstName: String(profile?.firstName || '').trim(),
        lastName: String(profile?.lastName || '').trim(),
        email: String(profile?.email || '').trim() || prev.email,
        phone: String(profile?.phone || '')
          .replace(/\D/g, '')
          .slice(0, 10),
        address: '',
        city: '',
        state: '',
        pincode: '',
        paymentMethod: prev.paymentMethod,
      }))
      return
    }
    const addr = savedAddressList.find((a) => a.id === id)
    if (!addr) return
    setSelectedSavedId(id)
    setFormData((prev) => ({
      ...prev,
      ...mergeShippingFromSaved(addr, profile),
      paymentMethod: prev.paymentMethod,
    }))
  }

  const summaryLines = useMemo(
    () =>
      items.map((i) => ({
        ...i,
        lineTotal: i.price * i.quantity,
      })),
    [items]
  )

  const itemCount = summaryLines.reduce((n, i) => n + i.quantity, 0)
  const onlineSelected = isRazorpayCheckoutMethod(formData.paymentMethod)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isCustomerLoggedIn()) {
      navigate(`/auth?redirect=${encodeURIComponent('/checkout')}`)
      return
    }
    const v = validateCheckout(formData)
    setErrors(v)
    if (Object.keys(v).length > 0) return
    if (items.length === 0) return

    setSubmitting(true)
    setSubmitError('')
    try {
      const stockError = await validateCartStockForCheckout(items)
      if (stockError) {
        setSubmitError(stockError)
        setSubmitting(false)
        return
      }
      const shipping = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      }
      const isOnlinePayment = isRazorpayCheckoutMethod(formData.paymentMethod)
      if (!USE_LOCAL_API && formData.paymentMethod === PAYMENT_COD && !codEnabled) {
        throw new Error('Cash on delivery is not available')
      }
      if (isOnlinePayment && !USE_LOCAL_API && !razorpayEnabled) {
        throw new Error(
          'Online payment is not set up yet. Choose Cash on Delivery or contact the store.'
        )
      }

      let checkoutTotal = checkoutTotals.total
      if (!USE_LOCAL_API) {
        const quote = await quoteCheckoutOrder({
          items: orderItems,
          couponCode: appliedCoupon?.code || '',
        })
        checkoutTotal = Number(quote?.total)
        if (!Number.isFinite(checkoutTotal) || checkoutTotal < 0) {
          throw new Error('Could not verify order total. Please refresh and try again.')
        }
      }

      const orderPayload = {
        shipping,
        paymentMethod: formData.paymentMethod,
        items: orderItems,
        total: checkoutTotal,
        couponCode: appliedCoupon?.code || undefined,
      }

      let order
      if (!USE_LOCAL_API && isOnlinePayment && razorpayEnabled) {
        order = await payWithRazorpay({
          items: orderPayload.items,
          total: orderPayload.total,
          shipping,
          paymentMethod: formData.paymentMethod,
          couponCode: orderPayload.couponCode,
        })
      } else {
        if (isOnlinePayment && USE_LOCAL_API) {
          throw new Error('Online payment requires the live API. Use Cash on Delivery in local demo mode.')
        }
        order = await placeStorefrontOrder(orderPayload)
      }
      const oid = order?.id || order?.publicId
      if (!oid) throw new Error('Order placed but no id returned')
      clearCart()
      navigate(`/orders?placed=${encodeURIComponent(oid)}`, { replace: true })
    } catch (err) {
      setSubmitError(err?.message || 'Could not place order. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isCustomerLoggedIn()) {
    return (
      <div className="page-shell page-shell--no-mobile-nav">
        <SiteHeader />
        <div className="section-container py-20 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ead7] text-2xl text-[#7a2c3a]">
            <i className="fa-regular fa-user" aria-hidden />
          </div>
          <h2 className="card-heading">Sign in to checkout</h2>
          <p className="mt-2 text-helper">Your bag is saved. Sign in to finish your order.</p>
          <Link
            to={`/auth?redirect=${encodeURIComponent('/checkout')}`}
            className="lux-button mt-6 inline-flex"
          >
            Sign in now
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="page-shell page-shell--no-mobile-nav">
        <SiteHeader />
        <div className="section-container py-16 text-center">
          <div className="lux-card mx-auto max-w-md py-14">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ead7] text-2xl text-[#7a2c3a]">
              <i className="fa-solid fa-cart-shopping" aria-hidden />
            </div>
            <h2 className="card-heading">Your cart is empty</h2>
            <p className="mt-2 text-helper">Add pieces from our collections before checkout.</p>
            <Link to="/collections" className="lux-button mt-6 inline-flex">
              Continue shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div id="main-content" className="page-shell page-shell--no-mobile-nav checkout-page" tabIndex={-1}>
      <SiteHeader />

      <div className="section-container py-8 sm:py-12">
        <p className="text-overline">Secure checkout</p>
        <h1 className="mt-2 font-bodoni text-3xl text-ink sm:text-4xl">Complete your order</h1>
        <p className="mt-2 text-helper">
          {itemCount} {itemCount === 1 ? 'piece' : 'pieces'} · Order total{' '}
          <strong className="text-ink">₹{checkoutTotals.total.toLocaleString()}</strong>
        </p>

        <CheckoutSteps current="checkout" />

        <TrustStrip className="mb-8" />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_min(380px,34%)] lg:gap-8 xl:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <section className="checkout-page__section" aria-labelledby="checkout-delivery-heading">
                <div className="checkout-page__section-head">
                  <span className="checkout-page__step-badge" aria-hidden>
                    1
                  </span>
                  <div>
                    <h2 id="checkout-delivery-heading" className="card-heading">
                      Delivery details
                    </h2>
                    <p className="mt-1 text-helper">Where should we send your order?</p>
                  </div>
                </div>

                <div className="checkout-page__section-body">
                  {savedAddressList.length > 0 ? (
                    <div className="mb-6">
                      <p className="form-label">Saved addresses</p>
                      <div className="checkout-page__address-grid">
                        {savedAddressList.map((a) => (
                          <label
                            key={a.id}
                            className={`checkout-page__address-card${
                              selectedSavedId === a.id ? ' checkout-page__address-card--selected' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="savedShipping"
                              checked={selectedSavedId === a.id}
                              onChange={() => pickSavedAddress(a.id)}
                            />
                            <span className="checkout-page__address-check" aria-hidden>
                              <i className="fa-solid fa-check text-[10px]" />
                            </span>
                            <span className="font-playfair text-sm font-semibold text-ink">{a.label}</span>
                            <span className="mt-1 block text-xs text-muted">
                              {[a.firstName, a.lastName].filter(Boolean).join(' ')}
                              {a.phone ? ` · ${a.phone}` : ''}
                            </span>
                            <span className="mt-2 block font-playfair text-sm leading-snug text-ink">
                              {a.address}, {a.city}, {a.state} {a.pincode}
                            </span>
                          </label>
                        ))}
                        <label
                          className={`checkout-page__address-card${
                            selectedSavedId === 'new' ? ' checkout-page__address-card--selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedShipping"
                            checked={selectedSavedId === 'new'}
                            onChange={() => pickSavedAddress('new')}
                          />
                          <span className="checkout-page__address-check" aria-hidden>
                            <i className="fa-solid fa-check text-[10px]" />
                          </span>
                          <span className="font-playfair text-sm font-semibold text-ink">
                            <i className="fa-solid fa-plus mr-2 text-gold" aria-hidden />
                            New address
                          </span>
                          <span className="mt-1 block text-xs text-muted">Enter delivery details below</span>
                        </label>
                      </div>
                      <p className="text-xs text-muted">
                        Manage addresses in{' '}
                        <Link to="/profile" className="text-[#7a2c3a] underline hover:text-ink">
                          your profile
                        </Link>
                        .
                      </p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                    <CheckoutField
                      id="co-firstName"
                      label="First name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={errors.firstName}
                      autoComplete="given-name"
                    />
                    <CheckoutField
                      id="co-lastName"
                      label="Last name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={errors.lastName}
                      autoComplete="family-name"
                    />
                    <CheckoutField
                      id="co-email"
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      autoComplete="email"
                    />
                    <CheckoutField
                      id="co-phone"
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      autoComplete="tel"
                    />
                    <div className="md:col-span-2">
                      <CheckoutField
                        id="co-address"
                        label="Street address"
                        name="address"
                        as="textarea"
                        value={formData.address}
                        onChange={handleChange}
                        error={errors.address}
                        rows={3}
                        autoComplete="street-address"
                      />
                    </div>
                    <CheckoutField
                      id="co-city"
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      autoComplete="address-level2"
                    />
                    <CheckoutField
                      id="co-state"
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      error={errors.state}
                      autoComplete="address-level1"
                    />
                    <CheckoutField
                      id="co-pincode"
                      label="Pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      error={errors.pincode}
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
              </section>

              <section className="checkout-page__section" aria-labelledby="checkout-payment-heading">
                <div className="checkout-page__section-head">
                  <span className="checkout-page__step-badge" aria-hidden>
                    2
                  </span>
                  <div>
                    <h2 id="checkout-payment-heading" className="card-heading">
                      Payment
                    </h2>
                    <p className="mt-1 text-helper">Choose how you would like to pay</p>
                  </div>
                </div>

                <div className="checkout-page__section-body">
                  <div className="checkout-page__notice" role="note">
                    <i className="fa-solid fa-circle-info" aria-hidden />
                    <p className="font-playfair leading-relaxed">
                      {razorpayEnabled ? (
                        <>
                          <strong>Pay online</strong> opens Razorpay — UPI (GPay, PhonePe, Paytm) or
                          debit/credit card. Or choose cash on delivery.
                        </>
                      ) : (
                        <>
                          Cash on delivery is available now. Add Razorpay keys on the server to enable
                          UPI and card payments online.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="checkout-page__payment-grid">
                    <label
                      className={`checkout-page__payment-option${
                        onlineSelected ? ' checkout-page__payment-option--selected' : ''
                      }${!razorpayEnabled && !USE_LOCAL_API ? ' checkout-page__payment-option--disabled' : ''}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={PAYMENT_RAZORPAY}
                        checked={onlineSelected}
                        onChange={handleChange}
                        disabled={!razorpayEnabled && !USE_LOCAL_API}
                      />
                      <span className="checkout-page__payment-icon" aria-hidden>
                        <i className="fa-solid fa-mobile-screen" />
                      </span>
                      <span className="font-playfair font-semibold text-ink">Pay online</span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {razorpayEnabled
                          ? 'UPI & card via Razorpay'
                          : 'Enable Razorpay on the server'}
                      </span>
                    </label>

                    <label
                      className={`checkout-page__payment-option${
                        formData.paymentMethod === PAYMENT_COD
                          ? ' checkout-page__payment-option--selected'
                          : ''
                      }${!codEnabled ? ' checkout-page__payment-option--disabled' : ''}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={PAYMENT_COD}
                        checked={formData.paymentMethod === PAYMENT_COD}
                        onChange={handleChange}
                        disabled={!codEnabled}
                      />
                      <span className="checkout-page__payment-icon" aria-hidden>
                        <i className="fa-solid fa-money-bill-wave" />
                      </span>
                      <span className="font-playfair font-semibold text-ink">Cash on delivery</span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {codEnabled ? 'Pay when your order arrives' : 'Currently unavailable'}
                      </span>
                    </label>
                  </div>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="lux-card p-5 sm:p-6">
                <h2 className="card-heading">Order summary</h2>

                <ul className="checkout-page__summary-items mt-4">
                  {summaryLines.map((i) => (
                    <li key={i.lineKey} className="checkout-page__summary-item">
                      <img
                        src={productImageUrl(i.image, 'thumb')}
                        alt=""
                        loading="lazy"
                        className="checkout-page__summary-thumb"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-playfair text-sm text-ink">{i.name}</p>
                        {i.variantLabel || i.variantName ? (
                          <p className="mt-0.5 text-xs text-muted">{i.variantLabel || i.variantName}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted">
                          Qty {i.quantity} · ₹{i.price.toLocaleString()} each
                        </p>
                      </div>
                      <p className="shrink-0 font-playfair text-sm font-medium text-ink">
                        ₹{i.lineTotal.toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  <FreeShippingProgress subtotal={totals.subtotal} />
                </div>

                <div className="mt-4 rounded-xl border border-[#eadfc9] bg-[#faf6ef] p-3">
                  <p className="font-playfair text-sm font-medium text-ink">Coupon code</p>
                  {appliedCoupon?.code ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-playfair text-sm text-[#7a2c3a]">
                        <i className="fa-solid fa-tag mr-1" aria-hidden />
                        {appliedCoupon.code} applied
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="font-playfair text-xs text-muted underline hover:text-[#7a2c3a]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="royal-input flex-1 uppercase"
                        aria-label="Coupon code"
                        disabled={couponBusy || USE_LOCAL_API}
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponBusy || USE_LOCAL_API}
                        className="lux-button shrink-0 px-4 py-2 text-sm disabled:opacity-60"
                      >
                        {couponBusy ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError ? (
                    <p className="mt-2 font-playfair text-xs text-red-700" role="alert">
                      {couponError}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 space-y-2.5 border-t border-[#eadfc9] pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-playfair text-ink">₹{checkoutTotals.subtotal.toLocaleString()}</span>
                  </div>
                  {checkoutTotals.couponDiscount > 0 ? (
                    <div className="flex justify-between text-[#7a2c3a]">
                      <span>Coupon discount</span>
                      <span className="font-playfair">−₹{checkoutTotals.couponDiscount.toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-muted">Shipping</span>
                    <span className="font-playfair text-ink">
                      {checkoutTotals.shipping > 0 ? `₹${checkoutTotals.shipping.toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#eadfc9] pt-3">
                    <span className="font-playfair text-lg text-ink">Total</span>
                    <span className="text-price">₹{checkoutTotals.total.toLocaleString()}</span>
                  </div>
                </div>

                {submitError ? (
                  <p
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 font-playfair text-sm text-red-800"
                    role="alert"
                  >
                    {submitError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="lux-button mt-5 block w-full text-center disabled:opacity-60"
                >
                  {submitting
                    ? formData.paymentMethod === PAYMENT_COD
                      ? 'Placing order…'
                      : 'Opening Razorpay…'
                    : onlineSelected && razorpayEnabled
                      ? 'Pay ₹' + checkoutTotals.total.toLocaleString()
                      : 'Place order · ₹' + checkoutTotals.total.toLocaleString()}
                </button>

                <p className="mt-3 text-center font-playfair text-xs text-muted">
                  <i className="fa-solid fa-lock mr-1 text-gold" aria-hidden />
                  Your details are used only to fulfil this order.
                </p>

                <Link
                  to="/cart"
                  className="mt-4 block text-center font-playfair text-sm text-muted transition-colors hover:text-[#7a2c3a]"
                >
                  ← Back to cart
                </Link>

                <a
                  href={whatsappUrl('Hi, I need help with checkout.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center font-playfair text-sm text-[#7a2c3a] hover:underline"
                >
                  <i className="fa-brands fa-whatsapp mr-1" aria-hidden />
                  Need help? Chat on WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}

export default CheckOut
