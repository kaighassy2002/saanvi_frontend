import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import '../Styles/user-profile.css'
import { CUSTOMER_SESSION_CHANGED_EVENT, STORAGE_KEYS } from '../../services/config'
import { notifyCustomerSessionChanged } from '../../services/customerStorageScope'
import {
  createAddressId,
  fetchSavedAddressesFromServer,
  readSavedAddresses,
  syncSavedAddressesToServer,
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

function profileInitials(firstName, lastName, email) {
  const fn = String(firstName || '').trim()
  const ln = String(lastName || '').trim()
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase()
  if (fn.length >= 2) return fn.slice(0, 2).toUpperCase()
  if (fn) return fn[0].toUpperCase()
  const em = String(email || '').trim()
  if (em.length >= 2) return em.slice(0, 2).toUpperCase()
  return 'AD'
}

const ACCOUNT_TABS = [
  { id: 'profile', label: 'Profile', icon: 'fa-solid fa-user' },
  { id: 'addresses', label: 'Addresses', icon: 'fa-solid fa-location-dot' },
  { id: 'security', label: 'Security', icon: 'fa-solid fa-lock' },
]

function UserProfile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
      if (err?.status === 401 || err?.statusCode === 401) {
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

  const refreshSavedAddresses = useCallback(async () => {
    const list = await fetchSavedAddressesFromServer()
    setSavedAddresses(list)
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'addresses' || tab === 'security' || tab === 'profile') {
      setActiveTab(tab)
    }
  }, [searchParams])

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

  const saveAddressEntry = async (e) => {
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
    await syncSavedAddressesToServer(next)
    setSavedAddresses(next)
    setAddressNotice({ tone: 'success', text: addressEditingId ? 'Address updated.' : 'Address saved.' })
    cancelAddressForm()
  }

  const deleteAddress = async (id) => {
    const next = readSavedAddresses().filter((a) => a.id !== id)
    writeSavedAddresses(next)
    await syncSavedAddressesToServer(next)
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
      if (err?.status === 401 || err?.statusCode === 401) {
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

  const initials = profileInitials(
    profileData.firstName,
    profileData.lastName,
    profileData.email,
  )

  const profileFields = [
    {
      id: 'firstName',
      label: 'First name',
      value: profileData.firstName || '—',
      icon: 'fa-solid fa-user',
    },
    {
      id: 'lastName',
      label: 'Last name',
      value: profileData.lastName || '—',
      icon: 'fa-solid fa-user-tag',
    },
    {
      id: 'email',
      label: 'Email',
      value: profileData.email || '—',
      icon: 'fa-solid fa-envelope',
    },
    {
      id: 'phone',
      label: 'Phone',
      value: profileData.phone || '—',
      icon: 'fa-solid fa-phone',
    },
  ]

  const renderAccountNav = () =>
    ACCOUNT_TABS.map((tab) => (
      <li key={tab.id} className="account-nav__item">
        <button
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`account-nav__btn ${
            activeTab === tab.id ? 'account-nav__btn--active' : ''
          }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <span className="account-nav__icon" aria-hidden>
            <i className={tab.icon} />
          </span>
          {tab.label}
        </button>
      </li>
    ))

  return (
    <div className="page-shell">
      <SiteHeader />

      <div className="account-page section-container">
        <header className="account-page__hero">
          <div>
            <p className="text-kicker mb-2">Account</p>
            <h1 className="account-page__hero-title">My profile</h1>
            <p className="account-page__hero-sub">
              Manage your details, saved addresses, and account security.
            </p>
          </div>
          <div className="account-page__hero-actions">
            <Link to="/orders" className="account-page__hero-link">
              <i className="fa-solid fa-bag-shopping text-xs" aria-hidden />
              Orders
            </Link>
            <Link to="/collections" className="account-page__hero-link">
              <i className="fa-solid fa-gem text-xs" aria-hidden />
              Shop
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="account-loading" aria-busy="true" aria-label="Loading profile">
            <div className="account-skeleton account-skeleton--sidebar" />
            <div className="account-skeleton account-skeleton--panel" />
          </div>
        ) : (
          <>
            <div className="account-tabs-mobile lg:hidden" role="tablist" aria-label="Account sections">
              {ACCOUNT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`account-tabs-mobile__btn ${
                    activeTab === tab.id ? 'account-tabs-mobile__btn--active' : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="account-layout">
              <aside className="account-sidebar">
                <div className="account-card account-card--sidebar">
                  <div className="account-profile-chip">
                    <span className="account-profile-chip__avatar" aria-hidden>
                      {initials}
                    </span>
                    <h2 className="account-profile-chip__name">{displayName}</h2>
                    <p className="account-profile-chip__email">{profileData.email || '—'}</p>
                    <span className="account-profile-chip__badge">
                      <i className="fa-solid fa-badge-check text-[9px]" aria-hidden />
                      Member
                    </span>
                  </div>
                  <ul className="account-nav hidden lg:block">
                    {renderAccountNav()}
                    <li className="account-nav__item">
                      <Link to="/orders" className="account-nav__link">
                        <span className="account-nav__icon" aria-hidden>
                          <i className="fa-solid fa-bag-shopping" />
                        </span>
                        Orders
                      </Link>
                    </li>
                  </ul>
                </div>
              </aside>

              <main className="account-main">
              {loadError ? (
                <p className="account-alert account-alert--warn mb-4" role="status">
                  {loadError} Showing cached details if available.{' '}
                  <button type="button" className="underline" onClick={loadProfile}>
                    Retry
                  </button>
                </p>
              ) : null}

              {activeTab === 'profile' && (
                <div className="account-card account-panel">
                  <div className="account-panel__head">
                    <div>
                      <h2 className="account-panel__title">Profile information</h2>
                      <p className="account-panel__desc">Your contact details for orders and delivery.</p>
                    </div>
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={startEditProfile}
                        className="account-btn-edit"
                        aria-label="Edit profile"
                      >
                        <i className="fa-solid fa-pen-to-square text-gold" aria-hidden />
                        Edit
                      </button>
                    ) : null}
                  </div>

                  {profileMessage.text ? (
                    <p
                      className={`account-alert ${
                        profileMessage.tone === 'success'
                          ? 'account-alert--success'
                          : 'account-alert--error'
                      }`}
                      role="status"
                    >
                      {profileMessage.text}
                    </p>
                  ) : null}

                  {!isEditingProfile ? (
                    <div className="account-field-grid">
                      {profileFields.map((field) => (
                        <div key={field.id} className="account-field">
                          <span className="account-field__icon" aria-hidden>
                            <i className={field.icon} />
                          </span>
                          <div className="min-w-0">
                            <p className="account-field__label">{field.label}</p>
                            <p className="account-field__value">{field.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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
                        <button type="submit" disabled={savingProfile} className="lux-button disabled:opacity-60">
                          {savingProfile ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditProfile}
                          className="button-tertiary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="account-card account-panel">
                  {addressNotice.text ? (
                    <p
                      className={`account-alert ${
                        addressNotice.tone === 'success'
                          ? 'account-alert--success'
                          : 'account-alert--error'
                      }`}
                      role="status"
                    >
                      {addressNotice.text}
                    </p>
                  ) : null}
                  <div className="account-panel__head">
                    <div>
                      <h2 className="account-panel__title">Saved addresses</h2>
                      <p className="account-panel__desc">
                        Save addresses for faster checkout. Stored on this device for your account.
                      </p>
                    </div>
                    <button type="button" onClick={startAddAddress} className="account-btn-edit">
                      <i className="fa-solid fa-plus" aria-hidden />
                      Add address
                    </button>
                  </div>

                  {savedAddresses.length > 0 ? (
                    <ul className="account-address-grid">
                      {savedAddresses.map((a) => (
                        <li key={a.id} className="account-address-card">
                          <div className="account-address-card__actions">
                            <button
                              type="button"
                              onClick={() => startEditAddress(a)}
                              className="account-address-card__action"
                              aria-label={`Edit ${a.label}`}
                            >
                              <i className="fa-solid fa-pen text-xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAddress(a.id)}
                              className="account-address-card__action account-address-card__action--danger"
                              aria-label={`Delete ${a.label}`}
                            >
                              <i className="fa-solid fa-trash text-xs" />
                            </button>
                          </div>
                          <span className="account-address-card__label">
                            <i className="fa-solid fa-location-dot text-[9px]" aria-hidden />
                            {a.label}
                          </span>
                          <p className="account-address-card__line">
                            {[a.firstName, a.lastName].filter(Boolean).join(' ')}
                            {a.phone ? ` · ${a.phone}` : ''}
                          </p>
                          <p className="account-address-card__line account-address-card__line--primary">
                            {a.address}, {a.city}, {a.state} {a.pincode}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="account-empty">
                      No saved addresses yet. Add one below or from checkout.
                    </p>
                  )}

                  <div className="account-form-block">
                  <h3 className="account-form-block__title">
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
                      <button type="submit" className="lux-button">
                        {addressEditingId ? 'Update address' : 'Save address'}
                      </button>
                      {addressEditingId || Object.values(addressForm).some(Boolean) ? (
                        <button type="button" onClick={cancelAddressForm} className="button-tertiary">
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="account-card account-panel">
                  <div className="account-panel__head">
                    <div>
                      <h2 className="account-panel__title">Security</h2>
                      <p className="account-panel__desc">Update your password to keep your account safe.</p>
                    </div>
                  </div>
                  <div className="account-security-tip">
                    <i className="fa-solid fa-shield-halved account-security-tip__icon" aria-hidden />
                    <p className="account-security-tip__text">
                      Use at least 8 characters with a mix of letters and numbers. Avoid passwords you use on
                      other sites.
                    </p>
                  </div>
                  {pwdMessage.text ? (
                    <p
                      className={`account-alert ${
                        pwdMessage.tone === 'success'
                          ? 'account-alert--success'
                          : 'account-alert--error'
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
                      className="lux-button disabled:opacity-60"
                    >
                      {pwdSaving ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                </div>
              )}
              </main>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default UserProfile
