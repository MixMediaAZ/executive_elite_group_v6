'use client'

import { useEffect, useState } from 'react'

type Tier = {
  id: string
  name: string
  description: string | null
  priceCents: number
  currency: string
  durationDays: number
  isFeatured: boolean
  isPremium: boolean
  active: boolean
  isSubscription: boolean
  interval: string | null
  stripePriceId: string | null
  stripeProductId: string | null
  _counts: { jobs: number; payments: number; subscriptions: number }
}

const blank = (): Partial<Tier> => ({
  name: '',
  description: '',
  priceCents: 0,
  currency: 'usd',
  durationDays: 30,
  isFeatured: false,
  isPremium: false,
  active: true,
  isSubscription: false,
  interval: null,
  stripePriceId: '',
  stripeProductId: '',
})

export default function TiersClient() {
  const [tiers, setTiers] = useState<Tier[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partial<Tier> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setError(null)
    fetch('/api/admin/tiers', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setTiers(d.tiers))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const save = async () => {
    if (!editing) return
    setSaving(true)
    setError(null)
    try {
      const isNew = !editing.id
      const url = isNew ? '/api/admin/tiers' : `/api/admin/tiers/${editing.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setEditing(null)
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (t: Tier) => {
    const inUse = t._counts.jobs + t._counts.payments + t._counts.subscriptions > 0
    const msg = inUse
      ? `"${t.name}" is referenced by ${t._counts.jobs} job(s), ${t._counts.payments} payment(s), ${t._counts.subscriptions} subscription(s). Archive it (mark inactive)?`
      : `Permanently delete "${t.name}"?`
    if (!window.confirm(msg)) return
    const res = await fetch(`/api/admin/tiers/${t.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || `HTTP ${res.status}`)
      return
    }
    load()
  }

  if (error && !tiers) return <div className="text-red-600">Failed to load: {error}</div>
  if (!tiers) return <div className="text-neutral-600">Loading…</div>

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <div className="flex justify-end">
        <button
          onClick={() => setEditing(blank())}
          className="px-4 py-2 bg-eeg-blue-electric text-white rounded-md hover:bg-eeg-blue-600 font-medium"
        >
          + New tier
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-neutral-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Price</th>
              <th className="py-2 px-3">Duration / Interval</th>
              <th className="py-2 px-3">Stripe Price ID</th>
              <th className="py-2 px-3">Flags</th>
              <th className="py-2 px-3">Usage</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.id} className={`border-b border-neutral-100 last:border-0 ${!t.active ? 'opacity-50' : ''}`}>
                <td className="py-2 px-3">
                  <div className="font-medium text-eeg-charcoal">{t.name}</div>
                  {t.description && <div className="text-xs text-neutral-500 truncate max-w-xs">{t.description}</div>}
                </td>
                <td className="py-2 px-3">
                  {t.isSubscription ? (
                    <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Subscription</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 rounded-full">One-time</span>
                  )}
                </td>
                <td className="py-2 px-3 tabular-nums">
                  ${(t.priceCents / 100).toFixed(2)} {t.currency.toUpperCase()}
                </td>
                <td className="py-2 px-3 text-neutral-700">
                  {t.isSubscription ? (t.interval || '—') : `${t.durationDays}d`}
                </td>
                <td className="py-2 px-3">
                  {t.stripePriceId ? (
                    <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{t.stripePriceId}</code>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {t.isFeatured && <span className="text-xs bg-eeg-blue-electric/10 text-eeg-blue-electric px-1.5 py-0.5 rounded">Featured</span>}
                    {t.isPremium && <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Premium</span>}
                    {!t.active && <span className="text-xs bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">Archived</span>}
                  </div>
                </td>
                <td className="py-2 px-3 text-xs text-neutral-600">
                  {t._counts.jobs}j / {t._counts.payments}p / {t._counts.subscriptions}s
                </td>
                <td className="py-2 px-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(t)} className="text-eeg-blue-electric hover:underline mr-3">Edit</button>
                  <button onClick={() => remove(t)} className="text-red-600 hover:underline">
                    {(t._counts.jobs + t._counts.payments + t._counts.subscriptions) > 0 ? 'Archive' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {tiers.length === 0 && (
              <tr><td colSpan={8} className="py-6 px-3 text-center text-neutral-500">No tiers yet. Create one to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <Editor tier={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} saving={saving} />}
    </div>
  )
}

function Editor({
  tier, onChange, onSave, onCancel, saving,
}: {
  tier: Partial<Tier>
  onChange: (t: Partial<Tier>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const set = (patch: Partial<Tier>) => onChange({ ...tier, ...patch })
  const priceDollars = ((tier.priceCents || 0) / 100).toFixed(2)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-eeg-charcoal">{tier.id ? 'Edit tier' : 'New tier'}</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name *">
            <input className={input} value={tier.name || ''} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Currency">
            <input className={input} value={tier.currency || 'usd'} onChange={(e) => set({ currency: e.target.value })} />
          </Field>
          <Field label="Description" full>
            <textarea className={input} rows={2} value={tier.description || ''} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="Price (USD)">
            <input
              type="number" step="0.01" min="0"
              className={input}
              value={priceDollars}
              onChange={(e) => set({ priceCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
            />
            <div className="text-xs text-neutral-500 mt-1">Stored as {tier.priceCents || 0} cents</div>
          </Field>
          <Field label="Duration (days, one-time only)">
            <input
              type="number" min="1"
              className={input}
              value={tier.durationDays || 30}
              onChange={(e) => set({ durationDays: parseInt(e.target.value || '30', 10) })}
            />
          </Field>

          <div className="md:col-span-2 border-t pt-4 mt-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!tier.isSubscription}
                onChange={(e) => set({ isSubscription: e.target.checked })}
              />
              <span className="font-medium text-eeg-charcoal">Recurring subscription</span>
            </label>
          </div>

          {tier.isSubscription && (
            <>
              <Field label="Billing interval *">
                <select className={input} value={tier.interval || ''} onChange={(e) => set({ interval: e.target.value || null })}>
                  <option value="">— choose —</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </Field>
              <Field label="Stripe Price ID *">
                <input
                  className={input}
                  placeholder="price_..."
                  value={tier.stripePriceId || ''}
                  onChange={(e) => set({ stripePriceId: e.target.value })}
                />
              </Field>
              <Field label="Stripe Product ID (optional)">
                <input
                  className={input}
                  placeholder="prod_..."
                  value={tier.stripeProductId || ''}
                  onChange={(e) => set({ stripeProductId: e.target.value })}
                />
              </Field>
            </>
          )}

          <div className="md:col-span-2 border-t pt-4 mt-2 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={!!tier.isFeatured} onChange={(e) => set({ isFeatured: e.target.checked })} />
              <span>Featured</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={!!tier.isPremium} onChange={(e) => set({ isPremium: e.target.checked })} />
              <span>Premium</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={tier.active !== false} onChange={(e) => set({ active: e.target.checked })} />
              <span>Active</span>
            </label>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onCancel} disabled={saving} className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50">Cancel</button>
          <button onClick={onSave} disabled={saving || !tier.name} className="px-4 py-2 bg-eeg-blue-electric text-white rounded-md hover:bg-eeg-blue-600 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

const input = 'w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-eeg-blue-electric/40'

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-neutral-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
