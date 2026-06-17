import React, { useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import { changeAdminPassword } from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import { INPUT_CLASS, PasswordInput, SettingsField, SettingsSection } from './components/AdminSettingsUi'

function AdminAccount() {
  const { authFetch, profile } = useAdminAuth()
  const { toast } = useAdminToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ tone: '', text: '' })

  const submitPassword = async (e) => {
    e.preventDefault()
    setMessage({ tone: '', text: '' })

    if (newPassword.length < 8) {
      setMessage({ tone: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ tone: 'error', text: 'New passwords do not match.' })
      return
    }

    setSaving(true)
    try {
      await changeAdminPassword(authFetch, { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ tone: 'success', text: 'Password updated successfully.' })
      toast('Password updated successfully.')
    } catch (err) {
      const text = err?.message || 'Could not update password'
      setMessage({ tone: 'error', text })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl pb-24">
      <AdminPageHeader
        title="Account"
        description="Manage your admin sign-in credentials."
      />

      <div className="mt-6 space-y-6">
        <SettingsSection
          title="Profile"
          description="Your admin account details (read-only)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField label="Email" htmlFor="admin-email">
              <input
                id="admin-email"
                type="email"
                className={`${INPUT_CLASS} bg-[#faf7f2] text-muted cursor-not-allowed`}
                value={profile?.email || ''}
                readOnly
                tabIndex={-1}
              />
            </SettingsField>
            <SettingsField label="Role" htmlFor="admin-role">
              <input
                id="admin-role"
                className={`${INPUT_CLASS} bg-[#faf7f2] text-muted cursor-not-allowed capitalize`}
                value={profile?.role || ''}
                readOnly
                tabIndex={-1}
              />
            </SettingsField>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Change password"
          description="Enter your current password, then choose a new one (minimum 8 characters)."
        >
          {message.text ? (
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                message.tone === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
              role="status"
            >
              {message.text}
            </p>
          ) : null}

          <form className="space-y-4 max-w-md" onSubmit={submitPassword}>
            <SettingsField label="Current password" htmlFor="admin-pwd-current">
              <PasswordInput
                id="admin-pwd-current"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </SettingsField>
            <SettingsField label="New password" htmlFor="admin-pwd-new" hint="At least 8 characters.">
              <PasswordInput
                id="admin-pwd-new"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </SettingsField>
            <SettingsField label="Confirm new password" htmlFor="admin-pwd-confirm">
              <PasswordInput
                id="admin-pwd-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </SettingsField>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#7a2c3a] px-4 py-2 text-sm font-medium text-white hover:bg-[#6a2430] disabled:opacity-60 transition"
            >
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </SettingsSection>
      </div>
    </div>
  )
}

export default AdminAccount
