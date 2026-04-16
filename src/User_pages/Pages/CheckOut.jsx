import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutSteps from '../Components/CheckoutSteps'
import Footer from '../Components/Footer'
import PageIntro from '../Components/PageIntro'
import SiteHeader from '../Components/SiteHeader'
import { useCart } from '../../hooks/useCart'
import { isCustomerLoggedIn } from '../../services/customerStorageScope'
import { STORAGE_KEYS } from '../../services/config'
import { placeStorefrontOrder } from '../../services/storefrontOrderService'
import { readSavedAddresses } from '../../services/savedAddresses'

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

function CheckOut() {
  const navigate = useNavigate()
  const { items, totals, clearCart } = useCart()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'card',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savedAddressList, setSavedAddressList] = useState([])
  const [selectedSavedId, setSelectedSavedId] = useState('new')

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
    const list = readSavedAddresses()
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
      const order = await placeStorefrontOrder({
        shipping,
        paymentMethod: formData.paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          image: i.image,
          quantity: i.quantity,
          price: i.price,
        })),
        total: totals.total,
      })
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

  if (!isCustomerLoggedIn() || items.length === 0) {
    return null
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <div className="section-container py-10 sm:py-14">
        <PageIntro
          eyebrow="Secure Checkout"
          title="Complete Your Purchase"
          subtitle="Fast, secure, and elegant checkout tailored for premium shopping."
          stats={[
            { label: 'Items', value: String(summaryLines.length) },
            { label: 'Total', value: `₹${totals.total.toLocaleString()}` },
          ]}
        />
        <CheckoutSteps current="checkout" />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e3d1b4] bg-white/80 px-4 py-3 text-sm text-muted">
            <i className="fa-solid fa-shield-halved mr-2 text-gold" aria-hidden />
            SSL encrypted checkout
          </div>
          <div className="rounded-xl border border-[#e3d1b4] bg-white/80 px-4 py-3 text-sm text-muted">
            <i className="fa-solid fa-truck-fast mr-2 text-gold" aria-hidden />
            Fast insured delivery
          </div>
          <div className="rounded-xl border border-[#e3d1b4] bg-white/80 px-4 py-3 text-sm text-muted">
            <i className="fa-solid fa-rotate-left mr-2 text-gold" aria-hidden />
            Easy support & returns
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6 sm:space-y-8 lg:col-span-2">
              <div className="lux-card p-5 sm:p-6">
                <h2 className="card-heading mb-5 sm:mb-6">Shipping Information</h2>

                {savedAddressList.length > 0 ? (
                  <div className="mb-6 rounded-xl border border-[#dcc6a6] bg-[#fffaf2] p-4 sm:p-5">
                    <p className="form-label mb-3">Deliver to</p>
                    <div className="space-y-3">
                      {savedAddressList.map((a) => (
                        <label
                          key={a.id}
                          className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                            selectedSavedId === a.id
                              ? 'border-gold bg-[#fff6eb]'
                              : 'border-transparent hover:border-[#dcc6a6]/80'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedShipping"
                            checked={selectedSavedId === a.id}
                            onChange={() => pickSavedAddress(a.id)}
                            className="mt-1"
                          />
                          <span className="min-w-0 text-sm">
                            <span className="font-playfair font-semibold text-ink">{a.label}</span>
                            <span className="mt-1 block text-muted">
                              {[a.firstName, a.lastName].filter(Boolean).join(' ')}
                              {a.phone ? ` · ${a.phone}` : ''}
                            </span>
                            <span className="mt-1 block font-playfair text-ink">
                              {a.address}, {a.city}, {a.state} {a.pincode}
                            </span>
                          </span>
                        </label>
                      ))}
                      <label
                        className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                          selectedSavedId === 'new'
                            ? 'border-gold bg-[#fff6eb]'
                            : 'border-transparent hover:border-[#dcc6a6]/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name="savedShipping"
                          checked={selectedSavedId === 'new'}
                          onChange={() => pickSavedAddress('new')}
                          className="mt-1"
                        />
                        <span className="font-playfair text-sm text-ink">Enter a different address</span>
                      </label>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      Manage saved addresses in{' '}
                      <Link to="/profile" className="text-gold underline hover:text-ink">
                        Profile → Addresses
                      </Link>
                      .
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="co-firstName">
                      First Name
                    </label>
                    <input
                      id="co-firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="royal-input"
                      autoComplete="given-name"
                      aria-invalid={!!errors.firstName}
                    />
                    {errors.firstName ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.firstName}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-label" htmlFor="co-lastName">
                      Last Name
                    </label>
                    <input
                      id="co-lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="royal-input"
                      autoComplete="family-name"
                      aria-invalid={!!errors.lastName}
                    />
                    {errors.lastName ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.lastName}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-label" htmlFor="co-email">
                      Email
                    </label>
                    <input
                      id="co-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="royal-input"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.email}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-label" htmlFor="co-phone">
                      Phone
                    </label>
                    <input
                      id="co-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="royal-input"
                      autoComplete="tel"
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.phone}</p>
                    ) : null}
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label" htmlFor="co-address">
                      Address
                    </label>
                    <textarea
                      id="co-address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="royal-input resize-none"
                      autoComplete="street-address"
                      aria-invalid={!!errors.address}
                    />
                    {errors.address ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.address}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-label" htmlFor="co-city">
                      City
                    </label>
                    <input
                      id="co-city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="royal-input"
                      autoComplete="address-level2"
                      aria-invalid={!!errors.city}
                    />
                    {errors.city ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.city}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-label" htmlFor="co-state">
                      State
                    </label>
                    <input
                      id="co-state"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="royal-input"
                      autoComplete="address-level1"
                      aria-invalid={!!errors.state}
                    />
                    {errors.state ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.state}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-label" htmlFor="co-pincode">
                      Pincode
                    </label>
                    <input
                      id="co-pincode"
                      type="text"
                      name="pincode"
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleChange}
                      className="royal-input"
                      autoComplete="postal-code"
                      aria-invalid={!!errors.pincode}
                    />
                    {errors.pincode ? (
                      <p className="mt-1 font-playfair text-xs text-red-700">{errors.pincode}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="lux-card p-5 sm:p-6">
                <h2 className="card-heading mb-5 sm:mb-6">Payment Method</h2>
                <div className="space-y-3 sm:space-y-4">
                  <label className="flex cursor-pointer items-center rounded-xl border-2 border-[#dcc6a6] p-4 transition-colors hover:border-[#7a2c3a]">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                      className="mr-4"
                    />
                    <i className="fa-solid fa-credit-card mr-4 text-2xl text-gold"></i>
                    <span className="font-playfair">Credit/Debit Card</span>
                  </label>
                  <label className="flex cursor-pointer items-center rounded-xl border-2 border-[#dcc6a6] p-4 transition-colors hover:border-[#7a2c3a]">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={formData.paymentMethod === 'upi'}
                      onChange={handleChange}
                      className="mr-4"
                    />
                    <i className="fa-solid fa-mobile-screen mr-4 text-2xl text-gold"></i>
                    <span className="font-playfair">UPI</span>
                  </label>
                  <label className="flex cursor-pointer items-center rounded-xl border-2 border-[#dcc6a6] p-4 transition-colors hover:border-[#7a2c3a]">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleChange}
                      className="mr-4"
                    />
                    <i className="fa-solid fa-money-bill-wave mr-4 text-2xl text-gold"></i>
                    <span className="font-playfair">Cash on Delivery</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="lux-card sticky top-24 p-5 sm:p-6">
                <h2 className="card-heading mb-5 sm:mb-6">Order Summary</h2>
                <ul className="mb-4 space-y-3 border-b border-[#eadfc9] pb-4 font-playfair text-sm">
                  {summaryLines.map((i) => (
                    <li key={i.productId} className="flex justify-between gap-2 text-muted">
                      <span className="min-w-0 truncate text-ink">
                        {i.name} × {i.quantity}
                      </span>
                      <span>₹{i.lineTotal.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="mb-5 space-y-3 sm:mb-6 sm:space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-playfair">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Shipping</span>
                    <span className="font-playfair">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Tax</span>
                    <span className="font-playfair">₹0</span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="font-playfair text-lg">Total</span>
                    <span className="text-price">₹{totals.total.toLocaleString()}</span>
                  </div>
                </div>
                {submitError ? (
                  <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 font-playfair text-sm text-red-800">
                    {submitError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="lux-button block w-full text-center disabled:opacity-60"
                >
                  {submitting ? 'Placing order…' : 'Place Order'}
                </button>
                <Link
                  to="/cart"
                  className="text-helper mt-3 block w-full text-center transition-colors hover:text-[#7a2c3a] sm:mt-4"
                >
                  ← Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  )
}

export default CheckOut
