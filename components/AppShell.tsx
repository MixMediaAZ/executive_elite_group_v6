'use client'

import { ReactNode } from 'react'
import TopNavigation from './top-navigation'
import DrawerNavigation from './drawer-navigation'

interface AppShellProps {
  userRole: string
  userEmail: string
  children: ReactNode
}

function AppShell({
  userRole,
  userEmail,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative eeg-wallpaper overflow-x-hidden">
      <div className="absolute inset-0 bg-gray-50/85 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col flex-1 overflow-x-hidden">
        <TopNavigation userRole={userRole} userEmail={userEmail} />
        <div className="flex flex-1 overflow-x-hidden">
          <DrawerNavigation userRole={userRole} userEmail={userEmail} />
          <main className="flex-1 lg:ml-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppShell

