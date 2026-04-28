import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../Components/Footer'
import PageIntro from '../Components/PageIntro'
import SiteHeader from '../Components/SiteHeader'
import { STORAGE_KEYS } from '../../services/config'
import { notifyCustomerSessionChanged } from '../../services/customerStorageScope'
import { goksRequestOTP, goksVerifyOTP, goksPatchMe } from '../../services/goksClient'

function safeCustomerRedirect(raw) {
  if (raw == null || typeof raw !== 'string') return '/'
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return '/'
  return t
}

/**
 * OTP auth flow:
 *   'phone'  → user enters phone number
 *   'otp'    → user enters 6-digit code
 *   'name'   → first-time user sets their name
 */
function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTarget = () => safeCustomerRedirect(searchParams.get('redirect'))

  const [step, setStep] = useState('phone')
  const [contact, setContact] = useState('')
  const [contactType] = useState('phone')  // extend to 'email' toggle later if needed
  const [otp, setOtp] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [customerToken, setCustomerToken] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('error')
  const [loading, setLoading] = useState(false)

  const showMessage = (text, tone = 'error') => {
    setMessage(text)
    setMessageTone(tone)
  }

  // Step 1 — request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault()
    const phone = contact.trim()
    if (!phone) return
    setLoading(true)
    setMessage('')
    try {
      await goksRequestOTP(phone, contactType)
      showMessage('OTP sent to your phone.', 'success')
      setStep('otp')
    } catch (err) {
      showMessage(err?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const data = await goksVerifyOTP(contact.trim(), contactType, otp.trim())
      const token = data.access_token
      localStorage.setItem(STORAGE_KEYS.customerToken, token)
      if (data.name) {
        localStorage.setItem(STORAGE_KEYS.customerProfile, JSON.stringify({ id: data.customer_id, name: data.name, phone: contact }))
      }
      notifyCustomerSessionChanged()

      if (data.is_new) {
        setCustomerToken(token)
        setStep('name')
      } else {
        showMessage('Signed in.', 'success')
        navigate(redirectTarget())
      }
    } catch (err) {
      showMessage(err?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 3 — save name (first time only)
  const handleSaveName = async (e) => {
    e.preventDefault()
    const name = nameInput.trim()
    setLoading(true)
    setMessage('')
    try {
      if (name) {
        const profile = await goksPatchMe(customerToken, { name })
        localStorage.setItem(STORAGE_KEYS.customerProfile, JSON.stringify({ id: profile.id, name: profile.name, phone: contact }))
        notifyCustomerSessionChanged()
      }
      navigate(redirectTarget())
    } catch {
      // Name save failed — still proceed
      navigate(redirectTarget())
    } finally {
      setLoading(false)
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
            subtitle="Sign in with your phone number for saved carts, wishlist sync, and faster checkout."
            stats={[
              { label: 'Secure', value: 'OTP' },
              { label: 'Quick Access', value: '1-Click' },
            ]}
          />

          <div className="lux-card mt-8 p-6 sm:p-8">
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

            {step === 'phone' && (
              <form className="space-y-4" onSubmit={handleRequestOTP}>
                <div>
                  <label className="form-label" htmlFor="auth-phone">
                    Mobile number
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    className="royal-input"
                    placeholder="+91 98765 43210"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                  <p className="text-xs text-muted mt-1">We'll send a 6-digit code to verify your number.</p>
                </div>
                <button type="submit" className="lux-button w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form className="space-y-4" onSubmit={handleVerifyOTP}>
                <div>
                  <label className="form-label" htmlFor="auth-otp">
                    Verification code
                  </label>
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    className="royal-input tracking-widest text-center text-xl"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-muted mt-1">Sent to {contact}</p>
                </div>
                <button type="submit" className="lux-button w-full" disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify'}
                </button>
                <button
                  type="button"
                  className="w-full text-sm text-muted hover:text-gold py-1"
                  onClick={() => { setStep('phone'); setOtp(''); setMessage(''); }}
                >
                  ← Change number
                </button>
              </form>
            )}

            {step === 'name' && (
              <form className="space-y-4" onSubmit={handleSaveName}>
                <div>
                  <label className="form-label" htmlFor="auth-name">
                    Your name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    className="royal-input"
                    placeholder="e.g. Priya Sharma"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                  <p className="text-xs text-muted mt-1">Optional — helps us personalise your experience.</p>
                </div>
                <button type="submit" className="lux-button w-full" disabled={loading}>
                  {loading ? 'Saving…' : 'Continue'}
                </button>
                <button
                  type="button"
                  className="w-full text-sm text-muted hover:text-gold py-1"
                  onClick={() => navigate(redirectTarget())}
                >
                  Skip for now
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Auth
