import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../Components/Footer'
import PageIntro from '../Components/PageIntro'
import SiteHeader from '../Components/SiteHeader'
import { CUSTOMER_SESSION_CHANGED_EVENT, STORAGE_KEYS } from '../../services/config'
import { notifyCustomerSessionChanged } from '../../services/customerStorageScope'
import {
  createAddressId,
  readSavedAddresses,
  writeSavedAddresses,
} from '../../services/savedAddresses'
import {
  customerGetMeRequest,
  customerPatchMeRequest,
  unwrapCustomerApi,
} from '../../services/customerProfileApi'

const emptyAddressForm = () => ({
  label: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
})

function mapUserToProfile(data) {
  return {
    firstName: String(data?.firstName || '').trim(),
    lastName: String(data?.lastName || '').trim(),
    email: String(data?.email || '').trim(),
    phone: String(data?.phone || '').trim(),
  }
}

function UserProfile() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [savedAddresses, setSavedAddresses] = useState([])
  const [addressForm, setAddressForm] = useState(emptyAddressForm)
  const [addressEditingId, setAddressEditingId] = useState(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const profileSnapshotRef = useRef(null)
  const [profileMessage, setProfileMessage] = useState({ tone: '', text: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMessage, setPwdMessage] = useState({ tone: '', text: '' })
  const [addressNotice, setAddressNotice] = useState({ tone: '', text: '' })

  const applyProfileToStorage = useCallback((user) => {
    if (user && typeof user === 'object') {
      localStorage.setItem(STORAGE_KEYS.customerProfile, JSON.stringify(user))
    }
  }, [])

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.customerToken)
    if (!token) {
      navigate('/auth', { replace: true })
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const raw = await customerGetMeRequest()
      const data = unwrapCustomerApi(raw)
      const next = mapUserToProfile(data)
      setProfileData(next)
      applyProfileToStorage(data)
    } catch (err) {
      if (err?.statusCode === 401) {
        localStorage.removeItem(STORAGE_KEYS.customerToken)
        localStorage.removeItem(STORAGE_KEYS.customerProfile)
        notifyCustomerSessionChanged()
        navigate('/auth', { replace: true })
        return
      }
      try {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.customerProfile) || 'null')
        if (cached) setProfileData(mapUserToProfile(cached))
      } catch {
        /* ignore */
      }
      setLoadError(err?.message || 'Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [navigate, applyProfileToStorage])

  const refreshSavedAddresses = useCallback(() => {
    setSavedAddresses(readSavedAddresses())
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    refreshSavedAddresses()
    const onSession = () => refreshSavedAddresses()
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, onSession)
    return () => window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, onSession)
  }, [refreshSavedAddresses])

  const handleAddressFormChange = (e) => {
    const { name, value } = e.target
    setAddressForm((prev) => ({ ...prev, [name]: value }))
  }

  const startAddAddress = () => {
    setAddressEditingId(null)
    setAddressForm(emptyAddressForm())
    setAddressNotice({ tone: '', text: '' })
  }

  const startEditAddress = (row) => {
    setAddressEditingId(row.id)
    setAddressForm({
      label: row.label || '',
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      phone: row.phone || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      pincode: row.pincode || '',
    })
    setAddressNotice({ tone: '', text: '' })
  }

  const cancelAddressForm = () => {
    setAddressEditingId(null)
    setAddressForm(emptyAddressForm())
  }

  const saveAddressEntry = (e) => {
    e.preventDefault()
    const label = addressForm.label.trim()
    if (!label) {
      setAddressNotice({ tone: 'error', text: 'Add a label (e.g. Home, Office).' })
      return
    }
    if (!addressForm.address.trim() || !addressForm.city.trim() || !addressForm.state.trim()) {
      setAddressNotice({ tone: 'error', text: 'Address, city, and state are required.' })
      return
    }
    if (!/^\d{6}$/.test(String(addressForm.pincode).trim())) {
      setAddressNotice({ tone: 'error', text: 'Pincode must be 6 digits.' })
      return
    }
    const digits = String(addressForm.phone).replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setAddressNotice({ tone: 'error', text: 'Enter a valid 10-digit mobile number.' })
      return
    }
    const entry = {
      id: addressEditingId || createAddressId(),
      label,
      firstName: addressForm.firstName.trim(),
      lastName: addressForm.lastName.trim(),
      phone: digits,
      address: addressForm.address.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
    }
    const list = readSavedAddresses()
    const next = addressEditingId
      ? list.map((a) => (a.id === addressEditingId ? entry : a))
      : [...list, entry]
    writeSavedAddresses(next)
    setSavedAddresses(next)
    setAddressNotice({ tone: 'success', text: addressEditingId ? 'Address updated.' : 'Address saved.' })
    cancelAddressForm()
  }

  const deleteAddress = (id) => {
    const next = readSavedAddresses().filter((a) => a.id !== id)
    writeSavedAddresses(next)
    setSavedAddresses(next)
    if (addressEditingId === id) cancelAddressForm()
    setAddressNotice({ tone: 'success', text: 'Address removed.' })
  }

  const startEditProfile = () => {
    profileSnapshotRef.current = { ...profileData }
    setProfileMessage({ tone: '', text: '' })
    setIsEditingProfile(true)
  }

  const cancelEditProfile = () => {
    if (profileSnapshotRef.current) setProfileData(profileSnapshotRef.current)
    profileSnapshotRef.current = null
    setIsEditingProfile(false)
    setProfileMessage({ tone: '', text: '' })
  }

  const handleProfileFieldChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMessage({ tone: '', text: '' })
    try {
      const raw = await customerPatchMeRequest({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      })
      const data = unwrapCustomerApi(raw)
      const next = mapUserToProfile(data)
      setProfileData(next)
      applyProfileToStorage(data)
      profileSnapshotRef.current = null
      setIsEditingProfile(false)
      setProfileMessage({ tone: 'success', text: 'Profile updated.' })
    } catch (err) {
      if (err?.statusCode === 401) {
        localStorage.removeItem(STORAGE_KEYS.customerToken)
        localStorage.removeItem(STORAGE_KEYS.customerProfile)
        notifyCustomerSessionChanged()
        navigate('/auth', { replace: true })
        return
      }
      setProfileMessage({ tone: 'error', text: err?.message || 'Could not save profile' })
    } finally {
      setSavingProfile(false)
    }
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setPwdMessage({ tone: '', text: '' })
    if (pwdNew.length < 8) {
      setPwdMessage({ tone: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    if (pwdNew !== pwdConfirm) {
      setPwdMessage({ tone: 'error', text: 'New passwords do not match.' })
      return
    }
    setPwdSaving(true)
    try {
      const raw = await customerPatchMeRequest({
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      })
      unwrapCustomerApi(raw)
      setPwdCurrent('')
      setPwdNew('')
      setPwdConfirm('')
      setPwdMessage({ tone: 'success', text: 'Password updated.' })
    } catch (err) {
      setPwdMessage({ tone: 'error', text: err?.message || 'Could not update password' })
    } finally {
      setPwdSaving(false)
    }
  }

  const displayName =
    [profileData.firstName, profileData.lastName].filter(Boolean).join(' ') ||
    profileData.email ||
    'Member'

  return (
    <div className="page-shell">
      <SiteHeader />

      <div className="section-container py-10 sm:py-14">
        <PageIntro
          eyebrow="Account Settings"
          title="My Profile"
          subtitle="Manage your details, saved addresses, and account security."
        />

        {loading ? (
          <p className="text-center font-playfair text-muted">Loading your profile…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="lux-card p-5 sm:p-6 sticky top-24">
                <div className="text-center mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-[#dcc6a6]/60">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gold rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <i className="fa-solid fa-user text-3xl sm:text-4xl text-ink" />
                  </div>
                  <h3 className="card-title mb-1">{displayName}</h3>
                  <p className="text-helper break-all">{profileData.email || '—'}</p>
                </div>
                <nav className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-playfair transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-gold text-ink'
                        : 'text-muted hover:bg-[#f7ecee]'
                    }`}
                  >
                    <i className="fa-solid fa-user mr-2" />
                    Profile
                  </button>
                  <Link
                    to="/orders"
                    className="block w-full text-left px-4 py-3 rounded-lg font-playfair text-muted hover:bg-[#f7ecee] transition-colors"
                  >
                    <i className="fas fa-shopping-bag mr-2" />
                    Orders
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-playfair transition-colors ${
                      activeTab === 'addresses'
                        ? 'bg-gold text-ink'
                        : 'text-muted hover:bg-[#f7ecee]'
                    }`}
                  >
                    <i className="fa-solid fa-location-dot mr-2" />
                    Addresses
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-playfair transition-colors ${
                      activeTab === 'security'
                        ? 'bg-gold text-ink'
                        : 'text-muted hover:bg-[#f7ecee]'
                    }`}
                  >
                    <i className="fa-solid fa-lock mr-2" />
                    Security
                  </button>
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3">
              {loadError ? (
                <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
                  {loadError} Showing cached details if available.{' '}
                  <button type="button" className="underline" onClick={loadProfile}>
                    Retry
                  </button>
                </p>
              ) : null}

              {activeTab === 'profile' && (
                <div className="lux-card p-5 sm:p-6">
                  <div className="mb-5 sm:mb-6 flex flex-wrap items-start justify-between gap-3">
                    <h2 className="card-heading">Profile Information</h2>
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={startEditProfile}
                        className="inline-flex items-center gap-2 rounded-full border border-[#dcc6a6] bg-[#fff6eb] px-4 py-2 text-sm font-playfair text-ink transition hover:border-gold hover:bg-[#f7ecee]"
                        aria-label="Edit profile"
                      >
                        <i className="fa-solid fa-pen-to-square text-gold" aria-hidden />
                        Edit
                      </button>
                    ) : null}
                  </div>

                  {profileMessage.text ? (
                    <p
                      className={`mb-4 rounded-lg px-3 py-2 text-sm font-playfair ${
                        profileMessage.tone === 'success'
                          ? 'bg-emerald-50 text-emerald-900'
                          : 'bg-red-50 text-red-900'
                      }`}
                      role="status"
                    >
                      {profileMessage.text}
                    </p>
                  ) : null}

                  {!isEditingProfile ? (
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                      <div>
                        <dt className="form-label mb-1">First name</dt>
                        <dd className="font-playfair text-ink">{profileData.firstName || '—'}</dd>
                      </div>
                      <div>
                        <dt className="form-label mb-1">Last name</dt>
                        <dd className="font-playfair text-ink">{profileData.lastName || '—'}</dd>
                      </div>
                      <div>
                        <dt className="form-label mb-1">Email</dt>
                        <dd className="font-playfair text-ink break-all">{profileData.email || '—'}</dd>
                      </div>
                      <div>
                        <dt className="form-label mb-1">Phone</dt>
                        <dd className="font-playfair text-ink">{profileData.phone || '—'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <form onSubmit={saveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className="form-label" htmlFor="prof-fn">
                            First Name
                          </label>
                          <input
                            id="prof-fn"
                            type="text"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleProfileFieldChange}
                            className="royal-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label" htmlFor="prof-ln">
                            Last Name
                          </label>
                          <input
                            id="prof-ln"
                            type="text"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleProfileFieldChange}
                            className="royal-input"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="form-label" htmlFor="prof-email">
                            Email
                          </label>
                          <input
                            id="prof-email"
                            type="email"
                            name="email"
                            value={profileData.email}
                            className="royal-input opacity-80"
                            disabled
                            readOnly
                          />
                          <p className="mt-1 text-xs text-muted">Email cannot be changed here.</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="form-label" htmlFor="prof-phone">
                            Phone
                          </label>
                          <input
                            id="prof-phone"
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleProfileFieldChange}
                            className="royal-input"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="rounded-full bg-gold text-ink px-6 sm:px-8 py-2.5 sm:py-3 font-playfair hover:bg-gold-dark transition-colors text-sm sm:text-base disabled:opacity-60"
                        >
                          {savingProfile ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditProfile}
                          className="rounded-full border border-[#dcc6a6] px-6 py-2.5 font-playfair text-muted transition hover:bg-[#f7ecee] text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="lux-card p-5 sm:p-6">
                  {addressNotice.text ? (
                    <p
                      className={`mb-4 rounded-lg px-3 py-2 text-sm font-playfair ${
                        addressNotice.tone === 'success'
                          ? 'bg-emerald-50 text-emerald-900'
                          : 'bg-red-50 text-red-900'
                      }`}
                      role="status"
                    >
                      {addressNotice.text}
                    </p>
                  ) : null}
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="card-heading">Saved addresses</h2>
                      <p className="mt-1 text-sm text-muted">
                        Save several addresses and pick one at checkout. Stored on this device for your
                        account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startAddAddress}
                      className="shrink-0 rounded-full border border-[#dcc6a6] bg-[#fff6eb] px-4 py-2 text-sm font-playfair text-ink transition hover:border-gold"
                    >
                      <i className="fa-solid fa-plus mr-2" aria-hidden />
                      Add address
                    </button>
                  </div>

                  {savedAddresses.length > 0 ? (
                    <ul className="mb-8 grid gap-4 sm:grid-cols-2">
                      {savedAddresses.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-xl border border-[#dcc6a6] bg-[#fffaf2] p-4 text-sm"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <span className="font-playfair font-semibold text-ink">{a.label}</span>
                            <span className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditAddress(a)}
                                className="text-gold hover:underline"
                                aria-label={`Edit ${a.label}`}
                              >
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAddress(a.id)}
                                className="text-red-800/80 hover:underline"
                                aria-label={`Delete ${a.label}`}
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </span>
                          </div>
                          <p className="text-muted">
                            {[a.firstName, a.lastName].filter(Boolean).join(' ')}
                            {a.phone ? ` · ${a.phone}` : ''}
                          </p>
                          <p className="mt-1 font-playfair text-ink">
                            {a.address}, {a.city}, {a.state} {a.pincode}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-8 text-sm text-muted">
                      No saved addresses yet. Add one below or from checkout.
                    </p>
                  )}

                  <h3 className="card-title mb-4">
                    {addressEditingId ? 'Edit address' : 'Add new address'}
                  </h3>
                  <form onSubmit={saveAddressEntry} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="form-label" htmlFor="addr-label">
                        Label
                      </label>
                      <input
                        id="addr-label"
                        name="label"
                        value={addressForm.label}
                        onChange={handleAddressFormChange}
                        className="royal-input"
                        placeholder="e.g. Home, Office, Parents"
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="addr-fn">
                        First name
                      </label>
                      <input
                        id="addr-fn"
                        name="firstName"
                        value={addressForm.firstName}
                        onChange={handleAddressFormChange}
                        className="royal-input"
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="addr-ln">
                        Last name
                      </label>
                      <input
                        id="addr-ln"
                        name="lastName"
                        value={addressForm.lastName}
                        onChange={handleAddressFormChange}
                        className="royal-input"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label" htmlFor="addr-phone">
                        Phone
                      </label>
                      <input
                        id="addr-phone"
                        name="phone"
                        type="tel"
                        value={addressForm.phone}
                        onChange={handleAddressFormChange}
                        className="royal-input"
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label" htmlFor="addr-line">
                        Street address
                      </label>
                      <textarea
                        id="addr-line"
                        name="address"
                        value={addressForm.address}
                        onChange={handleAddressFormChange}
                        rows={3}
                        className="royal-input resize-none"
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="addr-city">
                        City
                      </label>
                      <input
                        id="addr-city"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressFormChange}
                        className="royal-input"
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="addr-state">
                        State
                      </label>
                      <input
                        id="addr-state"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressFormChange}
                        className="royal-input"
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="addr-pin">
                        Pincode
                      </label>
                      <input
                        id="addr-pin"
                        name="pincode"
                        inputMode="numeric"
                        maxLength={6}
                        value={addressForm.pincode}
                        onChange={handleAddressFormChange}
                        className="royal-input"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 md:col-span-2">
                      <button
                        type="submit"
                        className="rounded-full bg-gold px-6 py-2.5 font-playfair text-ink transition hover:bg-gold-dark"
                      >
                        {addressEditingId ? 'Update address' : 'Save address'}
                      </button>
                      {addressEditingId || Object.values(addressForm).some(Boolean) ? (
                        <button
                          type="button"
                          onClick={cancelAddressForm}
                          className="rounded-full border border-[#dcc6a6] px-6 py-2.5 font-playfair text-muted transition hover:bg-[#f7ecee]"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="lux-card p-5 sm:p-6">
                  <h2 className="card-heading mb-5 sm:mb-6">Change password</h2>
                  {pwdMessage.text ? (
                    <p
                      className={`mb-4 rounded-lg px-3 py-2 text-sm font-playfair ${
                        pwdMessage.tone === 'success'
                          ? 'bg-emerald-50 text-emerald-900'
                          : 'bg-red-50 text-red-900'
                      }`}
                      role="status"
                    >
                      {pwdMessage.text}
                    </p>
                  ) : null}
                  <form className="space-y-4 max-w-md" onSubmit={submitPassword}>
                    <div>
                      <label className="form-label" htmlFor="pwd-current">
                        Current password
                      </label>
                      <input
                        id="pwd-current"
                        type="password"
                        value={pwdCurrent}
                        onChange={(e) => setPwdCurrent(e.target.value)}
                        className="royal-input"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="pwd-new">
                        New password
                      </label>
                      <input
                        id="pwd-new"
                        type="password"
                        value={pwdNew}
                        onChange={(e) => setPwdNew(e.target.value)}
                        className="royal-input"
                        autoComplete="new-password"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="pwd-confirm">
                        Confirm new password
                      </label>
                      <input
                        id="pwd-confirm"
                        type="password"
                        value={pwdConfirm}
                        onChange={(e) => setPwdConfirm(e.target.value)}
                        className="royal-input"
                        autoComplete="new-password"
                        required
                        minLength={8}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pwdSaving}
                      className="rounded-full bg-gold text-ink px-6 sm:px-8 py-2.5 sm:py-3 font-playfair hover:bg-gold-dark transition-colors text-sm sm:text-base disabled:opacity-60"
                    >
                      {pwdSaving ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default UserProfile
