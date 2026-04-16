import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { LOCAL_ADMIN_EMAIL } from '../services/adminAuthService'
import { USE_LOCAL_API } from '../services/config'

export default function AdminLogin() {
  const { isAuthenticated, login } = useAdminAuth()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={from} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err?.message || 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a1116] to-[#3a151d] px-4 py-16 text-[#f8f1e6]">
      <div className="mx-auto w-full max-w-md">
        <p className="text-center text-kicker text-gold-light">
          SAANVI Admin
        </p>
        <h1 className="mt-3 text-center font-bodoni text-3xl text-white">Sign in</h1>
        <p className="mt-2 text-center font-playfair text-sm text-[#d4c4b8]">
          Protected area — staff only.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-2xl border border-[#5a1f2b] bg-[#1f1514]/90 p-8 shadow-xl backdrop-blur"
        >
          {error ? (
            <p className="rounded-xl bg-red-950/50 px-4 py-2 text-center text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div>
            <label className="form-label text-[#d4c4b8]">Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="royal-input border-[#5a1f2b] bg-[#2a1116]/80 text-[#f8f1e6] placeholder:text-muted"
              placeholder="admin@jewellery.com"
              required
            />
          </div>
          <div>
            <label className="form-label text-[#d4c4b8]">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="royal-input border-[#5a1f2b] bg-[#2a1116]/80 text-[#f8f1e6]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gold py-3 font-playfair font-semibold text-ink transition hover:bg-gold-dark disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          {USE_LOCAL_API ? (
            <p className="text-center font-playfair text-xs text-[#a8988c]">
              Local demo: <span className="text-gold-light">{LOCAL_ADMIN_EMAIL}</span> /{' '}
              <span className="text-gold-light">admin123</span>
            </p>
          ) : null}

          <p className="text-center font-playfair text-sm">
            <Link to="/" className="text-gold-light underline-offset-4 hover:underline">
              Back to store
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
