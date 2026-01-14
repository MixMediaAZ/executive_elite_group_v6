import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DrawerNavigation from '@/components/drawer-navigation'
import MessageThread from './message-thread'
import Link from 'next/link'

export default async function MessagePage({ params }: { params: { id: string } }) {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  const message = await db.message.findUnique({
    where: { id: params.id },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          candidateProfile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          employerProfile: {
            select: {
              organizationName: true,
            },
          },
        },
      },
      recipient: {
        select: {
          id: true,
          email: true,
        },
      },
      application: {
        select: {
          id: true,
          job: {
            select: {
              title: true,
            },
          },
        },
      },
      parentMessage: {
        select: {
          id: true,
          subject: true,
          body: true,
          sender: {
            select: {
              email: true,
            },
          },
        },
      },
      replies: {
        include: {
          sender: {
            select: {
              email: true,
              candidateProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              employerProfile: {
                select: {
                  organizationName: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: 'asc' },
      },
    },
  })

  if (!message) {
    redirect('/dashboard/messages')
  }

  // Verify user has access
  if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
    redirect('/dashboard/messages')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />

      <main className="flex-1 lg:ml-0">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <Link
                href="/dashboard/messages"
                className="text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
              >
                ← Back to Messages
              </Link>
            </div>

            <MessageThread
              initialMessage={{
                ...message,
                sentAt: message.sentAt instanceof Date ? message.sentAt.toISOString() : message.sentAt,
                replies: message.replies.map((reply: { id: string; sentAt: Date; sender: unknown; body: string }) => ({
                  ...reply,
                  sentAt: reply.sentAt instanceof Date ? reply.sentAt.toISOString() : reply.sentAt,
                })),
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

