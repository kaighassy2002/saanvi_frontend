import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import BrandLogo from '../Components/BrandLogo'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { GoogleLogin } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID, STORAGE_KEYS, USE_LOCAL_API } from '../../services/config'
import { notifyCustomerSessionChanged } from '../../services/customerStorageScope'
import {
  customerLogin,
  customerGoogleLogin,
  customerRegister,
  customerForgotPasswordRequest,
  customerForgotPasswordVerifyOtp,
  customerForgotPasswordReset,
} from '../../services/jewelleryApi'
import '../Styles/auth-page.css'
import '../Styles/footer-brand.css'

function safeCustomerRedirect(raw) {
  if (raw == null || typeof raw !== 'string') return '/'
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return '/'
  return t
}

function persistSession(token, user) {
  localStorage.setItem(STORAGE_KEYS.customerToken, token)
  localStorage.setItem(STORAGE_KEYS.customerProfile, JSON.stringify(user))
  notifyCustomerSessionChanged()
}

const AUTH_PERKS = [
  { icon: 'fa-solid fa-heart', text: 'Save wishlist and cart across devices' },
  { icon: 'fa-solid fa-bag-shopping', text: 'Faster checkout with saved details' },
  { icon: 'fa-solid fa-truck-fast', text: 'Track orders and delivery updates' },
  { icon: 'fa-solid fa-star', text: 'Leave verified reviews on pieces you own' },
]

const MOBILE_PERKS = [
  { icon: 'fa-solid fa-heart', text: 'Wishlist' },
  { icon: 'fa-solid fa-truck-fast', text: 'Track orders' },
  { icon: 'fa-solid fa-star', text: 'Reviews' },
]

function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTarget = () => safeCustomerRedirect(searchParams.get('redirect'))

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('error')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState('request')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotResetToken, setForgotResetToken] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  function openForgotPassword() {
    setShowForgotPassword(true)
    setForgotStep('request')
    setForgotOtp('')
    setForgotResetToken('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    if (email.trim()) setForgotEmail(email.trim().toLowerCase())
  }

  function closeForgotPassword() {
    setShowForgotPassword(false)
    setForgotStep('request')
    setForgotOtp('')
    setForgotResetToken('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotLoading(false)
  }

  useEffect(() => {
    const urlMode = searchParams.get('mode')
    if (urlMode === 'register') setMode('register')
    if (urlMode === 'login') setMode('login')
  }, [searchParams])

  const switchMode = (next) => {
    setMode(next)
    setMessage('')
    closeForgotPassword()
  }

  const showMessage = (text, tone = 'error') => {
    setMessage(text)
    setMessageTone(tone)
  }

  const promptRegistration = (err, profile = {}) => {
    if (err?.status !== 404 || err?.data?.code !== 'REGISTRATION_REQUIRED') return false
    switchMode('register')
    if (profile.email || err.data?.email) setEmail(profile.email || err.data.email)
    if (profile.firstName || err.data?.firstName) {
      setFirstName(profile.firstName || err.data.firstName)
    }
    if (profile.lastName || err.data?.lastName) setLastName(profile.lastName || err.data.lastName)
    showMessage(err.message || 'Please register to continue.')
    return true
  }

  const handleLocalDemoSignIn = () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !password) {
      showMessage('Email and password required')
      return
    }
    const user = {
      id: 'local-demo',
      email: trimmedEmail,
      firstName: firstName.trim() || 'Guest',
      lastName: lastName.trim() || 'User',
      name: `${firstName.trim() || 'Guest'} ${lastName.trim() || 'User'}`.trim(),
      phone: phone.replace(/\D/g, ''),
    }
    persistSession('local-demo-token', user)
    showMessage('Signed in (demo mode).', 'success')
    navigate(redirectTarget())
  }

  const googleSignInEnabled = !USE_LOCAL_API && Boolean(GOOGLE_CLIENT_ID)

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential
    if (!credential) {
      showMessage('Google sign-in failed')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const data = await customerGoogleLogin({
        credential,
        intent: mode === 'register' ? 'register' : 'login',
      })
      persistSession(data.token, data.user)
      showMessage(
        mode === 'register' ? 'Account created with Google.' : 'Signed in with Google.',
        'success',
      )
      navigate(redirectTarget())
    } catch (err) {
      if (!promptRegistration(err)) {
        showMessage(err?.message || 'Google sign-in failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (USE_LOCAL_API) {
        handleLocalDemoSignIn()
        return
      }

      if (mode === 'register') {
        if (!firstName.trim()) {
          showMessage('First name required')
          return
        }
        const data = await customerRegister({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.replace(/\D/g, ''),
        })
        persistSession(data.token, data.user)
        showMessage('Account created. Welcome!', 'success')
        navigate(redirectTarget())
        return
      }

      const data = await customerLogin({
        email: email.trim(),
        password,
      })
      persistSession(data.token, data.user)
      showMessage('Signed in.', 'success')
      navigate(redirectTarget())
    } catch (err) {
      if (!promptRegistration(err)) {
        showMessage(err?.message || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'
  const redirect = redirectTarget()

  const googleSignInBlock = googleSignInEnabled ? (
    <div className="auth-page__google-wrap">
      <div className="auth-page__google">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => showMessage('Google sign-in was cancelled or failed')}
          theme="outline"
          size="large"
          width="360"
          text={isRegister ? 'signup_with' : 'signin_with'}
          shape="rectangular"
        />
      </div>
      <div className="auth-page__divider" aria-hidden>
        <span>or continue with email</span>
      </div>
    </div>
  ) : null

  const modeTabs = !USE_LOCAL_API ? (
    <>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'login'}
        className={`auth-page__tab${mode === 'login' ? ' auth-page__tab--active' : ''}`}
        onClick={() => switchMode('login')}
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'register'}
        className={`auth-page__tab${mode === 'register' ? ' auth-page__tab--active' : ''}`}
        onClick={() => switchMode('register')}
      >
        Register
      </button>
    </>
  ) : null

  const mobileModeTabs = !USE_LOCAL_API ? (
    <>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'login'}
        className={`auth-page__mobile-tab${mode === 'login' ? ' auth-page__mobile-tab--active' : ''}`}
        onClick={() => switchMode('login')}
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'register'}
        className={`auth-page__mobile-tab${mode === 'register' ? ' auth-page__mobile-tab--active' : ''}`}
        onClick={() => switchMode('register')}
      >
        Register
      </button>
    </>
  ) : null

  const handleForgotRequest = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageTone('error')
    setForgotLoading(true)
    try {
      const data = await customerForgotPasswordRequest(forgotEmail.trim().toLowerCase())
      setMessageTone('success')
      setMessage(data?.message || 'If an account exists for this email, an OTP has been sent.')
      setForgotStep('verify')
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.message || 'Could not send OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotVerify = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageTone('error')
    setForgotLoading(true)
    try {
      const data = await customerForgotPasswordVerifyOtp(
        forgotEmail.trim().toLowerCase(),
        forgotOtp.trim(),
      )
      const token = String(data?.resetToken || '')
      if (!token) throw new Error('Invalid OTP verification response')
      setForgotResetToken(token)
      setForgotStep('reset')
      setMessageTone('success')
      setMessage('OTP verified. Set your new password.')
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.message || 'Invalid OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotReset = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageTone('error')
    if (forgotNewPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setMessage('New password and confirm password must match')
      return
    }
    setForgotLoading(true)
    try {
      const data = await customerForgotPasswordReset(forgotResetToken, forgotNewPassword)
      setMessageTone('success')
      setMessage(data?.message || 'Password reset successful. Please login.')
      closeForgotPassword()
      setMode('login')
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.message || 'Could not reset password')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div id="main-content" className="page-shell page-shell--no-mobile-nav" tabIndex={-1}>
      <SiteHeader />

      <section className="auth-page">
        <div className="auth-page__layout section-container">
          <aside className="auth-page__visual hidden lg:flex">
            <div className="auth-page__visual-inner">
              <div className="auth-page__logo-wrap">
                <div className="site-footer__brand-wrap">
                  <BrandLogo variant="footer" />
                </div>
              </div>
              <h2 className="auth-page__visual-title">Your jewellery wardrobe, always with you</h2>
              <p className="auth-page__visual-text">
                Join {USE_LOCAL_API ? 'our demo' : 'Aashmika Designs'} to save favourites, checkout
                smoothly, and manage orders in one place.
              </p>
              <ul className="auth-page__perks">
                {AUTH_PERKS.map((perk) => (
                  <li key={perk.text} className="auth-page__perk">
                    <span className="auth-page__perk-icon" aria-hidden>
                      <i className={perk.icon} />
                    </span>
                    {perk.text}
                  </li>
                ))}
              </ul>
            </div>
            <p className="auth-page__visual-foot">
              Handcrafted pieces for weddings, festivals, and everyday elegance.
            </p>
          </aside>

          <div className="auth-page__main">
            <div className="auth-page__mobile-only lg:hidden">
              <header className="auth-page__mobile-header">
                <div className="auth-page__mobile-logo">
                  <BrandLogo variant="default" />
                </div>
                {!USE_LOCAL_API ? (
                  <div className="auth-page__mobile-tabs" role="tablist" aria-label="Sign in or register">
                    {mobileModeTabs}
                  </div>
                ) : null}
              </header>

              <div className="auth-page__mobile-body">
                <h1 className="auth-page__mobile-title">
                  {USE_LOCAL_API
                    ? 'Demo sign in'
                    : isRegister
                      ? 'Create your account'
                      : 'Sign in'}
                </h1>
                <p className="auth-page__mobile-subtitle">
                  {USE_LOCAL_API
                    ? 'Local preview — no server required.'
                    : isRegister
                      ? 'Join to save favourites, checkout faster, and track orders.'
                      : 'Welcome back — use the email linked to your orders.'}
                </p>
                {!USE_LOCAL_API ? (
                  <ul className="auth-page__mobile-perks" aria-label="Member benefits">
                    {MOBILE_PERKS.map((perk) => (
                      <li key={perk.text} className="auth-page__mobile-perk">
                        <i className={perk.icon} aria-hidden />
                        {perk.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="auth-page__desktop-intro hidden lg:block">
              <p className="auth-page__eyebrow">Member access</p>
              <h1 className="auth-page__title">
                {USE_LOCAL_API ? 'Demo sign in' : isRegister ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="auth-page__subtitle">
                {USE_LOCAL_API
                  ? 'Local preview mode — no server required.'
                  : isRegister
                    ? 'Register with your email to shop and track orders.'
                    : 'Sign in with the email you used when ordering.'}
              </p>
            </div>

            <div className="auth-page__content">
              <div className="auth-page__stack">
              {redirect === '/checkout' ? (
                <div className="auth-page__checkout-note" role="status">
                  <i className="fa-solid fa-bag-shopping" aria-hidden />
                  <span>
                    Sign in to complete checkout. Your cart stays saved after you sign in.
                  </span>
                </div>
              ) : null}

              {!showForgotPassword && !USE_LOCAL_API ? (
                <div
                  className="auth-page__tabs auth-page__tabs--desktop hidden lg:flex"
                  role="tablist"
                  aria-label="Sign in or register"
                >
                  {modeTabs}
                </div>
              ) : null}

              {!showForgotPassword ? googleSignInBlock : null}

              {!showForgotPassword ? (
                <div className="auth-page__email-section">
                  {message ? (
                    <p
                      className={`auth-page__alert auth-page__alert--${messageTone === 'success' ? 'success' : 'error'}`}
                      role="status"
                    >
                      {message}
                    </p>
                  ) : null}

                  <form className="auth-page__form" onSubmit={handleSubmit}>
                  {(isRegister || USE_LOCAL_API) && (
                    <div className="auth-page__field-group">
                      <div className="auth-page__row">
                        <div className="auth-page__field">
                          <label className="form-label" htmlFor="auth-first">
                            First name
                          </label>
                          <input
                            id="auth-first"
                            type="text"
                            autoComplete="given-name"
                            className="royal-input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required={isRegister && !USE_LOCAL_API}
                          />
                        </div>
                        <div className="auth-page__field">
                          <label className="form-label" htmlFor="auth-last">
                            Last name
                          </label>
                          <input
                            id="auth-last"
                            type="text"
                            autoComplete="family-name"
                            className="royal-input"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="auth-page__field">
                        <label className="form-label" htmlFor="auth-phone">
                          Mobile <span className="auth-page__optional">(optional)</span>
                        </label>
                        <input
                          id="auth-phone"
                          type="tel"
                          autoComplete="tel"
                          className="royal-input"
                          placeholder="10-digit mobile"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="auth-page__credentials">
                    <div className="auth-page__field">
                      <label className="form-label" htmlFor="auth-email">
                        Email
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        required
                        className="royal-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="auth-page__field">
                      <div className="auth-page__label-row">
                        <label className="form-label auth-page__label-row-label" htmlFor="auth-password">
                          Password
                        </label>
                        {!USE_LOCAL_API && mode === 'login' ? (
                          <button
                            type="button"
                            className="auth-page__forgot-link"
                            onClick={openForgotPassword}
                          >
                            Forgot password?
                          </button>
                        ) : null}
                      </div>
                      <input
                        id="auth-password"
                        type="password"
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        required
                        minLength={8}
                        className="royal-input"
                        placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="auth-page__submit">
                    <button type="submit" className="lux-button w-full disabled:opacity-60" disabled={loading}>
                      {loading
                        ? 'Please wait…'
                        : USE_LOCAL_API
                          ? 'Continue (demo)'
                          : isRegister
                            ? 'Create account'
                            : 'Sign in'}
                    </button>
                  </div>
                </form>
                </div>
              ) : null}

              {message && showForgotPassword ? (
                <p
                  className={`auth-page__alert auth-page__alert--${messageTone === 'success' ? 'success' : 'error'}`}
                  role="status"
                >
                  {message}
                </p>
              ) : null}

              {!USE_LOCAL_API && showForgotPassword ? (
                <div className="mt-6 rounded-xl border border-[#e5d2bf] bg-[#fff7f0] p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-playfair text-base text-ink">Reset password with OTP</h3>
                    <button type="button" className="text-sm text-muted hover:text-ink" onClick={closeForgotPassword}>
                      Close
                    </button>
                  </div>

                  {forgotStep === 'request' ? (
                    <form className="auth-page__form" onSubmit={handleForgotRequest}>
                      <label className="form-label" htmlFor="forgot-email">
                        Account email
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        className="royal-input"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                      <button type="submit" className="lux-button w-full" disabled={forgotLoading}>
                        {forgotLoading ? 'Sending OTP…' : 'Send OTP'}
                      </button>
                    </form>
                  ) : null}

                  {forgotStep === 'verify' ? (
                    <form className="auth-page__form" onSubmit={handleForgotVerify}>
                      <p className="text-sm text-muted">
                        Enter the 6-digit OTP sent to <span className="font-semibold text-ink">{forgotEmail}</span>.
                      </p>
                      <label className="form-label" htmlFor="forgot-otp">
                        OTP
                      </label>
                      <input
                        id="forgot-otp"
                        type="text"
                        required
                        maxLength={6}
                        className="royal-input tracking-[0.35em]"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button type="button" className="lux-button-outline w-full" onClick={() => setForgotStep('request')}>
                          Resend OTP
                        </button>
                        <button type="submit" className="lux-button w-full" disabled={forgotLoading}>
                          {forgotLoading ? 'Verifying…' : 'Verify OTP'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {forgotStep === 'reset' ? (
                    <form className="auth-page__form" onSubmit={handleForgotReset}>
                      <label className="form-label" htmlFor="forgot-new-password">
                        New password
                      </label>
                      <input
                        id="forgot-new-password"
                        type="password"
                        required
                        minLength={8}
                        className="royal-input"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                      />
                      <label className="form-label" htmlFor="forgot-confirm-password">
                        Confirm new password
                      </label>
                      <input
                        id="forgot-confirm-password"
                        type="password"
                        required
                        minLength={8}
                        className="royal-input"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                      <button type="submit" className="lux-button w-full" disabled={forgotLoading}>
                        {forgotLoading ? 'Updating password…' : 'Update password'}
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}

              {!USE_LOCAL_API ? (
                <p className="auth-page__mobile-switch lg:hidden">
                  {isRegister ? (
                    <>
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchMode('login')}>
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      New here?{' '}
                      <button type="button" onClick={() => switchMode('register')}>
                        Create an account
                      </button>
                    </>
                  )}
                </p>
              ) : (
                <p className="auth-page__footer-hint lg:hidden">
                  <Link to="/collections">Continue shopping</Link> without signing in
                </p>
              )}

              <p className="auth-page__footer-hint auth-page__footer-hint--desktop">
                {isRegister && !USE_LOCAL_API ? (
                  <>
                    Already have an account?{' '}
                    <button type="button" className="border-0 bg-transparent p-0 font-inherit" onClick={() => switchMode('login')}>
                      Sign in
                    </button>
                  </>
                ) : !USE_LOCAL_API ? (
                  <>
                    New here?{' '}
                    <button type="button" className="border-0 bg-transparent p-0 font-inherit" onClick={() => switchMode('register')}>
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/collections">Continue shopping</Link> without signing in
                  </>
                )}
              </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Auth
