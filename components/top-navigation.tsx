'use client'

import Image from 'next/image'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface TopNavigationProps {
  userRole: string
  userEmail: string
}

export default function TopNavigation({ userRole, userEmail }: TopNavigationProps) {
  const pathname = usePathname()

  const candidateLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/ai', label: 'AI Tools' },
    { href: '/dashboard/jobs', label: 'Jobs' },
    { href: '/dashboard/applications', label: 'Applications' },
    { href: '/dashboard/messages', label: 'Messages' },
  ]

  const employerLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/ai', label: 'AI Tools' },
    { href: '/dashboard/jobs', label: 'Jobs' },
    { href: '/dashboard/applications', label: 'Applications' },
    { href: '/dashboard/messages', label: 'Messages' },
  ]

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/ai', label: 'AI Tools' },
    { href: '/dashboard/admin', label: 'Admin' },
    { href: '/dashboard/admin/analytics', label: 'Analytics' },
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
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-white via-blue-50 to-white border-b-2 border-eeg-blue-electric shadow-lg overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo */}
          <div className="flex items-center min-w-0 flex-shrink">
            <Link href="/dashboard" className="flex items-center gap-3 sm:gap-4 hover:opacity-90 min-h-[44px] sm:min-h-0 group">
              <Image
                src="/logo.jpg"
                alt="Executive Elite Group"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain flex-shrink-0 transition-transform group-hover:scale-105"
                width={200}
                height={200}
                priority
              />
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-eeg-charcoal hidden sm:inline truncate font-serif">Executive Elite Group</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  text-base font-semibold transition-all py-3 px-2 relative
                  ${isActive(link.href)
                    ? 'text-eeg-blue-electric'
                    : 'text-neutral-700 hover:text-eeg-blue-electric'
                  }
                `}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-eeg-blue-mid to-eeg-blue-electric rounded-t-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-shrink">
            <span className="hidden lg:block text-sm font-medium text-neutral-700 truncate max-w-[150px] px-3 py-2 bg-white/60 rounded-lg">
              {userEmail}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:from-eeg-blue-600 hover:to-eeg-blue-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px] sm:min-h-0 flex items-center"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t-2 border-eeg-blue-electric bg-white/95 overflow-x-hidden">
        <div className="px-4 py-3 flex space-x-2 overflow-x-auto scrollbar-hide">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] flex items-center
                ${isActive(link.href)
                  ? 'bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white shadow-md'
                  : 'text-neutral-700 hover:bg-eeg-blue-50 hover:text-eeg-blue-electric'
                }
              `}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

