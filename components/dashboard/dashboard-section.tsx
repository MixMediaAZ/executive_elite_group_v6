import Link from 'next/link'
import type { ReactNode } from 'react'

interface DashboardSectionProps {
  /** Section heading */
  title: string
  /** Optional count shown next to the title, e.g. "12 total" */
  count?: ReactNode
  /** Optional "View all" link */
  actionHref?: string
  /** Label for the action link (default: "View all") */
  actionLabel?: string
  children: ReactNode
}

/**
 * A titled content card used across all dashboards. Keeps headings,
 * spacing and the "View all →" affordance consistent.
 */
export default function DashboardSection({
  title,
  count,
  actionHref,
  actionLabel = 'View all',
  children,
}: DashboardSectionProps) {
  return (
    <section className="bg-white shadow-sm rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-serif text-eeg-charcoal">
          {title}
          {count != null && (
            <span className="ml-2 text-sm font-sans text-neutral-500 align-middle">
              {count}
            </span>
          )}
        </h2>
        {actionHref && (
          <Link
            href={actionHref}
            className="shrink-0 text-sm font-medium text-eeg-blue-electric hover:text-eeg-blue-600"
          >
            {actionLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
