import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthProvider'
import {
  createStaff,
  deleteStaff,
  getStaffPermissionsMeta,
  listStaff,
  updateStaff,
} from './services/adminApi'
import { useAdminToast } from './shared/AdminToastProvider'
import AdminPageHeader from './components/AdminPageHeader'
import AdminErrorBanner from './components/AdminErrorBanner'
import AdminConfirmDialog from './components/AdminConfirmDialog'
import AdminDataTable from './components/AdminDataTable'
import { PasswordInput, INPUT_CLASS, SettingsField } from './components/AdminSettingsUi'
import { PERMISSION_LABELS } from './utils/adminPermissions'

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  role: 'support',
  permissions: [],
  useCustomPermissions: false,
})

function permissionsForRole(role, meta) {
  const preset = meta?.roles?.find((r) => r.key === role)
  return preset?.defaultPermissions ? [...preset.defaultPermissions] : []
}

function AdminStaff() {
  const { authFetch, profile } = useAdminAuth()
  const { toast } = useAdminToast()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [editId, setEditId] = useState(null)
  const [editPassword, setEditPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isOwner = String(profile?.role || '').toLowerCase() === 'owner'
  const roleOptions = useMemo(() => {
    const base = meta?.assignableRoles || ['admin', 'catalog', 'fulfillment', 'support']
    return isOwner ? ['owner', ...base] : base
  }, [meta, isOwner])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [staff, permissionMeta] = await Promise.all([
        listStaff(authFetch),
        getStaffPermissionsMeta(authFetch),
      ])
      setRows(staff)
      setMeta(permissionMeta)
    } catch (e) {
      setError(e?.message || 'Failed to load staff')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    load()
  }, [load])

  const setRole = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      permissions: prev.useCustomPermissions ? prev.permissions : permissionsForRole(role, meta),
    }))
  }

  const togglePermission = (key) => {
    setForm((prev) => {
      const next = new Set(prev.permissions)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { ...prev, useCustomPermissions: true, permissions: [...next] }
    })
  }

  const startEdit = (row) => {
    setEditId(row.id)
    const custom =
      Array.isArray(row.permissions) &&
      row.permissions.length > 0 &&
      JSON.stringify([...row.permissions].sort()) !==
        JSON.stringify(permissionsForRole(row.role, meta).sort())
    setForm({
      name: row.name || '',
      email: row.email || '',
      password: '',
      role: row.role || 'support',
      permissions: custom ? [...row.permissions] : permissionsForRole(row.role, meta),
      useCustomPermissions: custom,
    })
    setEditPassword('')
  }

  const resetForm = () => {
    setForm(emptyForm())
    setEditId(null)
    setEditPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        role: form.role,
        permissions: form.useCustomPermissions ? form.permissions : [],
      }
      if (editId) {
        if (editPassword) body.newPassword = editPassword
        await updateStaff(authFetch, editId, body)
        toast('Staff account updated.')
      } else {
        body.email = form.email.trim()
        body.password = form.password
        await createStaff(authFetch, body)
        toast('Staff account created.')
      }
      resetForm()
      await load()
    } catch (err) {
      toast(err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleDisabled = async (row) => {
    try {
      await updateStaff(authFetch, row.id, { disabled: !row.disabled })
      toast(row.disabled ? 'Staff account enabled.' : 'Staff account disabled.')
      await load()
    } catch (e) {
      toast(e?.message || 'Update failed', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteStaff(authFetch, deleteTarget.id)
      setDeleteTarget(null)
      toast('Staff account deleted.')
      if (editId === deleteTarget.id) resetForm()
      await load()
    } catch (e) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const permissionChoices = meta?.permissions || Object.entries(PERMISSION_LABELS).map(([key, label]) => ({
    key,
    label,
  }))

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => row.name || '—',
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => row.email,
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <span className="capitalize">{row.role}</span>,
    },
    {
      key: 'access',
      label: 'Access',
      render: (row) => (
        <span className="text-xs text-muted">
          {(row.effectivePermissions || []).map((p) => PERMISSION_LABELS[p] || p).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
            row.disabled ? 'bg-stone-200 text-stone-600' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {row.disabled ? 'Disabled' : 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" className="text-xs text-[#7a2c3a] hover:underline" onClick={() => startEdit(row)}>
            Edit
          </button>
          <button
            type="button"
            className="text-xs text-muted hover:text-ink"
            onClick={() => toggleDisabled(row)}
          >
            {row.disabled ? 'Enable' : 'Disable'}
          </button>
          <button
            type="button"
            className="text-xs text-red-700 hover:underline"
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-5xl pb-24">
      <AdminPageHeader
        title="Staff accounts"
        description="Create and manage team logins. Your owner account is not listed here — use Account for your own password."
      />

      <AdminErrorBanner message={error} onRetry={load} />

      <form onSubmit={handleSubmit} className="lux-card p-5 mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="admin-section-title text-base">{editId ? 'Edit staff account' : 'New staff account'}</h2>
          {editId ? (
            <button type="button" className="text-xs text-muted hover:text-ink" onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Full name" htmlFor="staff-name">
            <input
              id="staff-name"
              className={INPUT_CLASS}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Optional"
            />
          </SettingsField>
          <SettingsField label="Email *" htmlFor="staff-email">
            <input
              id="staff-email"
              type="email"
              className={`${INPUT_CLASS} ${editId ? 'bg-[#faf7f2] text-muted cursor-not-allowed' : ''}`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required={!editId}
              readOnly={Boolean(editId)}
            />
          </SettingsField>
        </div>

        {!editId ? (
          <SettingsField label="Temporary password *" htmlFor="staff-password" hint="At least 8 characters. Share securely with the team member.">
            <PasswordInput
              id="staff-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </SettingsField>
        ) : (
          <SettingsField label="Reset password" htmlFor="staff-new-password" hint="Leave blank to keep the current password.">
            <PasswordInput
              id="staff-new-password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              autoComplete="new-password"
              minLength={editPassword ? 8 : undefined}
            />
          </SettingsField>
        )}

        <SettingsField label="Role preset" htmlFor="staff-role">
          <select
            id="staff-role"
            className={INPUT_CLASS}
            value={form.role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {meta?.roles?.find((r) => r.key === role)?.label || role}
              </option>
            ))}
          </select>
        </SettingsField>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-ink">Access permissions</span>
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={form.useCustomPermissions}
                onChange={(e) => {
                  const checked = e.target.checked
                  setForm((prev) => ({
                    ...prev,
                    useCustomPermissions: checked,
                    permissions: checked ? prev.permissions : permissionsForRole(prev.role, meta),
                  }))
                }}
              />
              Customize permissions
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissionChoices.map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  form.permissions.includes(key)
                    ? 'border-[#7a2c3a]/30 bg-[#fff7f8]'
                    : 'border-[#efe2d1] bg-white'
                } ${form.useCustomPermissions ? 'cursor-pointer' : 'opacity-80'}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.permissions.includes(key)}
                  disabled={!form.useCustomPermissions}
                  onChange={() => togglePermission(key)}
                />
                <span>
                  <span className="block text-ink">{label}</span>
                </span>
              </label>
            ))}
          </div>
          {!form.useCustomPermissions ? (
            <p className="text-xs text-muted mt-2">
              Permissions follow the selected role preset. Enable customization to fine-tune access.
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#7a2c3a] px-4 py-2 text-sm font-medium text-white hover:bg-[#6a2430] disabled:opacity-60 transition"
        >
          {saving ? 'Saving…' : editId ? 'Save changes' : 'Create staff account'}
        </button>
      </form>

      <AdminDataTable columns={columns} loading={loading} emptyMessage="No staff accounts yet.">
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-[#f0e6d6] last:border-0 hover:bg-[#faf7f2]">
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 align-top">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </AdminDataTable>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete staff account?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.email}? They will no longer be able to sign in.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default AdminStaff
