import Link from 'next/link'
import type { ReactNode } from 'react'

interface StatCardProps {
  /** Short label, e.g. "Applications" */
  label: string
  /** Primary value, e.g. 12 or "Verified" */
  value: ReactNode
  /** Optional secondary context line, e.g. "3 this week" */
  hint?: ReactNode
  /** Optional accent color for the value text */
  accent?: 'default' | 'blue' | 'green' | 'amber' | 'red'
  /** Optional link — turns the whole card into a navigable element */
  href?: string
  /** Optional leading icon node */
  icon?: ReactNode
}

const ACCENT_CLASS: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'text-eeg-charcoal',
  blue: 'text-eeg-blue-electric',
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
}

/**
 * A single KPI tile. Server-component safe (purely presentational).
 * Shared across the candidate, employer and admin dashboards so every
 * stat row stays visually identical.
 */
export default function StatCard({
  label,
  value,
  hint,
  accent = 'default',
  href,
  icon,
}: StatCardProps) {
  const inner = (
    <div className="h-full bg-white rounded-2xl border border-neutral-200 p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-600">{label}</h3>
        {icon ? <span className="text-neutral-400">{icon}</span> : null}
      </div>
      <p className={`text-3xl font-bold mt-2 ${ACCENT_CLASS[accent]}`}>{value}</p>
      {hint ? <p className="text-xs text-neutral-500 mt-1">{hint}</p> : null}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-eeg-blue-electric"
      >
        {inner}
      </Link>
    )
  }

  return inner
}
