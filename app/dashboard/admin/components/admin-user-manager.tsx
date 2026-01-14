'use client'

import { useState } from 'react'

type UserRow = {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  lastLoginAt?: string | null
}

const roles = ['CANDIDATE', 'EMPLOYER', 'ADMIN']
const statuses = ['ACTIVE', 'SUSPENDED']

type Props = {
  users: UserRow[]
  currentAdminId: string
}

export default function AdminUserManager({ users, currentAdminId }: Props) {
  const [rows, setRows] = useState(users)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleUpdate = async (userId: string, updates: Partial<UserRow>) => {
    setSaving(userId)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to update user')
        setSaving(null)
        return
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === userId ? { ...row, ...updates } : row
        )
      )
      setMessage('User updated successfully.')
    } catch {
      setError('Unexpected error. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">User Management</h2>
      <p className="text-sm text-gray-600 mb-4">
        Promote, suspend, or reprioritize user access. Administrative actions are logged automatically.
      </p>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 mb-4">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((user: UserRow) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.email}</div>
                  <div className="text-xs text-gray-500">ID: {user.id}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-eeg-blue-electric"
                    value={user.role}
                    onChange={(e) => handleUpdate(user.id, { role: e.target.value })}
                    disabled={saving === user.id}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-eeg-blue-electric"
                    value={user.status}
                    onChange={(e) => handleUpdate(user.id, { status: e.target.value })}
                    disabled={saving === user.id || user.id === currentAdminId}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {saving === user.id && (
                    <span className="text-xs text-gray-500">Saving…</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

