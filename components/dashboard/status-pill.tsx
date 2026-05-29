interface StatusPillProps {
  /** Raw status string from the DB (Application or Job status) */
  status: string
}

/**
 * Color-coded status badge for application and job statuses.
 * Unknown statuses fall back to a neutral gray pill so new statuses
 * never break the UI.
 */
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  // Application statuses
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  REVIEWING: { label: 'Under Review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  INTERVIEW: { label: 'Interview', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  OFFER: { label: 'Offer', className: 'bg-green-50 text-green-700 border-green-200' },
  ACCEPTED: { label: 'Accepted', className: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  WITHDRAWN: { label: 'Withdrawn', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  // Job statuses
  LIVE: { label: 'Live', className: 'bg-green-50 text-green-700 border-green-200' },
  PENDING_ADMIN_REVIEW: { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  DRAFT: { label: 'Draft', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  CLOSED: { label: 'Closed', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  REJECTED_JOB: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
}

function humanize(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function StatusPill({ status }: StatusPillProps) {
  const style = STATUS_STYLES[status]
  const label = style?.label ?? humanize(status)
  const className =
    style?.className ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  )
}
