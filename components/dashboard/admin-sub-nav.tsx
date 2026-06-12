'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Shared admin navigation. Placed on every admin surface so the
 * separate `/admin/*` and `/dashboard/admin/*` routes feel like one
 * unified admin product.
 */
const ADMIN_LINKS: { href: string; label: string }[] = [
  { href: '/admin', label: 'Home' },
  { href: '/dashboard/admin', label: 'Console' },
  { href: '/dashboard/admin/analytics', label: 'Analytics' },
  { href: '/admin/employers', label: 'Employers' },
  { href: '/admin/insights', label: 'Insights' },
  { href: '/admin/health', label: 'Health' },
  { href: '/admin/traffic', label: 'Traffic' },
  { href: '/admin/job-views', label: 'Job Views' },
  { href: '/admin/tiers', label: 'Tiers' },
]

export default function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin sections"
      className="mb-6 flex flex-wrap gap-1.5 border-b border-gray-200 pb-3"
    >
      {ADMIN_LINKS.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== '/admin' &&
            link.href !== '/dashboard/admin' &&
            pathname.startsWith(link.href)) ||
          (link.href === '/dashboard/admin' && pathname === '/dashboard/admin')

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-eeg-blue-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-eeg-charcoal'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
