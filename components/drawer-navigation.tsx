'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import NotificationBell from './notification-bell'

interface DrawerNavigationProps {
  userRole: string
  userEmail: string
}

export default function DrawerNavigation({ userRole, userEmail }: DrawerNavigationProps) {
  const [isOpen, setIsOpen] = useState(false) // Start closed for better UX
  const pathname = usePathname()

  const candidateLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/ai', label: 'AI Tools', icon: '✨' },
    { href: '/dashboard/profile', label: 'My Profile', icon: '👤' },
    { href: '/dashboard/jobs', label: 'Browse Jobs', icon: '🔍' },
    { href: '/dashboard/applications', label: 'My Applications', icon: '📝' },
    { href: '/dashboard/saved', label: 'Saved Jobs', icon: '⭐' },
    { href: '/dashboard/messages', label: 'Messages', icon: '💬' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
  ]

  const employerLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/ai', label: 'AI Tools', icon: '✨' },
    { href: '/dashboard/profile', label: 'Company Profile', icon: '🏢' },
    { href: '/dashboard/jobs', label: 'Job Postings', icon: '📋' },
    { href: '/dashboard/jobs/new', label: 'Post New Job', icon: '➕' },
    { href: '/dashboard/applications', label: 'Applications', icon: '📥' },
    { href: '/dashboard/messages', label: 'Messages', icon: '💬' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
  ]

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/ai', label: 'AI Tools', icon: '✨' },
    { href: '/dashboard/admin', label: 'Admin Console', icon: '🛠️' },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: '📈' },
  ]

  const links = userRole === 'ADMIN' 
    ? adminLinks 
    : userRole === 'CANDIDATE' 
    ? candidateLinks 
    : employerLinks

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 truncate">{userEmail}</p>
              <div className="flex items-center space-x-2">
                <NotificationBell />
                <button
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]
                      ${isActive(link.href)
                        ? 'bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button - only show when drawer is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-24 sm:top-28 left-4 z-[60] p-3 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  )
}

