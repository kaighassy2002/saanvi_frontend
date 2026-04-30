import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import PageIntro from '../Components/PageIntro'
import SiteHeader from '../Components/SiteHeader'
import {
  loginAPI,
  registerAPI,
  requestPasswordResetOtpAPI,
  verifyPasswordResetOtpAPI,
  resetPasswordWithOtpAPI,
} from '../../server/allApi'
import { STORAGE_KEYS } from '../../services/config'
import { notifyCustomerSessionChanged } from '../../services/customerStorageScope'

function safeCustomerRedirect(raw) {
  if (raw == null || typeof raw !== 'string') return '/'
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return '/'
  return t
}

/** commonAPI returns axios response on success, or the axios error object on failure (no throw). */
function dataFromCommonAPI(result) {
  if (result?.response) {
    const { status, data } = result.response
    const raw =
      (typeof data === 'object' && data != null && data.message) ||
      (typeof data === 'string' ? data : null) ||
      result.message ||
      'Something went wrong'
    const msg = typeof raw === 'string' ? raw : 'Request failed'
    const err = new Error(msg)
    err.statusCode = status
    throw err
  }
  const status = result?.status
  if (status >= 200 && status < 300 && result?.data !== undefined) {
    return result.data
  }
  throw new Error(result?.message || 'Could not reach server')
}

function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectAfterAuth = () => safeCustomerRedirect(searchParams.get('redirect'))
  const [mode, setMode] = useState('login')
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

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageTone('error')
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    const email = String(fd.get('email') || '').trim()
    const password = String(fd.get('password') || '')
    try {
      const raw = await loginAPI({ email, password })
      const data = dataFromCommonAPI(raw)
      const token = data?.token || data?.accessToken
      if (!token) throw new Error('No token in response')
      localStorage.setItem(STORAGE_KEYS.customerToken, token)
      if (data?.user && typeof data.user === 'object') {
        localStorage.setItem(STORAGE_KEYS.customerProfile, JSON.stringify(data.user))
      }
      notifyCustomerSessionChanged()
      setMessageTone('success')
      setMessage('Signed in successfully.')
      navigate(redirectAfterAuth())
    } catch (err) {
      setMessageTone('error')
      setMessage(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageTone('error')
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    const reqBody = {
      firstName: String(fd.get('firstName') || '').trim(),
      lastName: String(fd.get('lastName') || '').trim(),
      email: String(fd.get('email') || '').trim().toLowerCase(),
      phone: String(fd.get('phone') || '').trim(),
      password: String(fd.get('password') || ''),
    }
    try {
      const raw = await registerAPI(reqBody)
      const data = dataFromCommonAPI(raw)
      const token = data?.token || data?.accessToken
      if (!token) throw new Error('No token in response')
      localStorage.setItem(STORAGE_KEYS.customerToken, token)
      if (data?.user && typeof data.user === 'object') {
        localStorage.setItem(STORAGE_KEYS.customerProfile, JSON.stringify(data.user))
      }
      notifyCustomerSessionChanged()
      setMessageTone('success')
      setMessage('Account created. You are signed in.')
      form.reset()
      navigate(redirectAfterAuth())
    } catch (err) {
      setMessageTone('error')
      const base = err?.message || 'Registration failed'
      const extra =
        err?.statusCode === 409
          ? ' Try signing in, or use a different email address.'
          : ''
      setMessage(base + extra)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotRequest = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageTone('error')
    setForgotLoading(true)
    try {
      const raw = await requestPasswordResetOtpAPI({ email: forgotEmail.trim().toLowerCase() })
      const data = dataFromCommonAPI(raw)
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
      const raw = await verifyPasswordResetOtpAPI({
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
      })
      const data = dataFromCommonAPI(raw)
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
      const raw = await resetPasswordWithOtpAPI({
        resetToken: forgotResetToken,
        newPassword: forgotNewPassword,
      })
      const data = dataFromCommonAPI(raw)
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
    <div className="page-shell">
      <SiteHeader />
      <section className="section-container py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <PageIntro
            eyebrow="Member Access"
            title="Welcome To SAANVI"
            subtitle="Sign in for saved carts, wishlist sync, and faster premium checkout."
            stats={[
              { label: 'Secure', value: '100%' },
              { label: 'Quick Access', value: '1-Click' },
            ]}
          />

          <div className="lux-card mt-8 p-6 sm:p-8">
            <div className="mb-8 grid grid-cols-2 rounded-full bg-[#f4e8db] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setMessage('')
                  setMessageTone('error')
                }}
                className={`rounded-full py-2 font-playfair transition ${mode === 'login' ? 'bg-gold text-ink' : 'text-muted'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setMessage('')
                  setMessageTone('error')
                }}
                className={`rounded-full py-2 font-playfair transition ${mode === 'register' ? 'bg-gold text-ink' : 'text-muted'}`}
              >
                Register
              </button>
            </div>

            {message ? (
              <p
                className={`mb-4 rounded-lg px-3 py-2 text-sm font-playfair ${
                  messageTone === 'success' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
                }`}
                role="status"
              >
                {message}
              </p>
            ) : null}

            {mode === 'login' ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label className="form-label" htmlFor="auth-login-email">
                    Email
                  </label>
                  <input
                    id="auth-login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    className="royal-input"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="auth-login-password">
                    Password
                  </label>
                  <input
                    id="auth-login-password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    className="royal-input"
                    placeholder="Enter password"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted">
                  <label className="inline-flex items-center gap-2" htmlFor="auth-login-remember">
                    <input id="auth-login-remember" type="checkbox" name="remember" />
                    Remember me
                  </label>
                  <button type="button" className="hover:text-gold" onClick={openForgotPassword}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="lux-button w-full" disabled={loading}>
                  {loading ? 'Please wait…' : 'Login'}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="auth-reg-first">
                      First name
                    </label>
                    <input
                      id="auth-reg-first"
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      required
                      className="royal-input"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="auth-reg-last">
                      Last name
                    </label>
                    <input
                      id="auth-reg-last"
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      className="royal-input"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" htmlFor="auth-reg-email">
                    Email
                  </label>
                  <input
                    id="auth-reg-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    className="royal-input"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="auth-reg-phone">
                    Phone
                  </label>
                  <input
                    id="auth-reg-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    className="royal-input"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="auth-reg-password">
                    Password
                  </label>
                  <input
                    id="auth-reg-password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="royal-input"
                    placeholder="At least 8 characters"
                  />
                </div>
                <button type="submit" className="lux-button w-full" disabled={loading}>
                  {loading ? 'Please wait…' : 'Create Account'}
                </button>
              </form>
            )}

            {showForgotPassword ? (
              <div className="mt-6 rounded-xl border border-[#e5d2bf] bg-[#fff7f0] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-playfair text-base text-ink">Reset password with OTP</h3>
                  <button type="button" className="text-sm text-muted hover:text-ink" onClick={closeForgotPassword}>
                    Close
                  </button>
                </div>

                {forgotStep === 'request' ? (
                  <form className="space-y-3" onSubmit={handleForgotRequest}>
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
                  <form className="space-y-3" onSubmit={handleForgotVerify}>
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
                  <form className="space-y-3" onSubmit={handleForgotReset}>
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
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Auth
