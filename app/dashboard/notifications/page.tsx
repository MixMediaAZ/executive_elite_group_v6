import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DrawerNavigation from '@/components/drawer-navigation'
import NotificationList from './notification-list'
import type { NotificationType } from '@/lib/domain-types'
import type { Notification as PrismaNotification } from '@prisma/client'

type NotificationListItem = {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  readAt: Date | null
  linkUrl: string | null
  metadata: unknown
  createdAt: Date
}

export default async function NotificationsPage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  const rawNotifications: PrismaNotification[] = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const parseMetadata = (metadataJson: PrismaNotification['metadataJson']): unknown => {
    if (!metadataJson) return null
    try {
      return JSON.parse(metadataJson)
    } catch {
      return null
    }
  }

  const notifications: NotificationListItem[] = rawNotifications.map((n: PrismaNotification) => ({
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    read: n.read,
    readAt: n.readAt ?? null,
    linkUrl: n.linkUrl ?? null,
    metadata: parseMetadata(n.metadataJson),
    createdAt: n.createdAt,
  }))

  const unreadCount = await db.notification.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />

      <main className="flex-1 lg:ml-0">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-serif text-eeg-charcoal">Notifications</h1>
                <p className="mt-2 text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <form
                  action={async () => {
                    'use server'
                    await db.notification.updateMany({
                      where: {
                        userId: session.user.id,
                        read: false,
                      },
                      data: {
                        read: true,
                        readAt: new Date(),
                      },
                    })
                  }}
                >
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
                  >
                    Mark all as read
                  </button>
                </form>
              )}
            </div>

            <NotificationList initialNotifications={notifications} />
          </div>
        </div>
      </main>
    </div>
  )
}

