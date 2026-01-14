import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DrawerNavigation from '@/components/drawer-navigation'
import PaymentCheckout from './payment-checkout'

export default async function JobPaymentPage({ params }: { params: { id: string } }) {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'EMPLOYER') {
    redirect('/dashboard')
  }

  const job = await db.job.findUnique({
    where: { id: params.id },
    include: {
      tier: true,
      employer: {
        select: { userId: true },
      },
      payments: {
        where: { status: 'paid' },
        take: 1,
      },
    },
  })

  if (!job) {
    redirect('/dashboard/jobs')
  }

  if (job.employer.userId !== session.user.id) {
    redirect('/dashboard/jobs')
  }

  // Check if already paid
  if (job.payments.length > 0) {
    redirect(`/dashboard/jobs/${job.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
      <main className="flex-1 lg:ml-0">
        <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-serif text-eeg-charcoal mb-6">Complete Payment</h1>
            <PaymentCheckout jobId={job.id} jobTitle={job.title} tierId={job.tierId} amountCents={job.tier.priceCents} />
          </div>
        </div>
      </main>
    </div>
  )
}

