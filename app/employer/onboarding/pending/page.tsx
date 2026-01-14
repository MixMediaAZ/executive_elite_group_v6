export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-eeg-charcoal mb-4">Profile Submitted</h1>
          <p className="text-gray-600 mb-6 text-base sm:text-lg">
            Your employer profile has been submitted and is pending admin approval.
            You will be notified once your profile is approved and you can start posting jobs.
          </p>
          <p className="text-sm text-gray-500">
            In the meantime, you can update your profile information if needed.
          </p>
        </div>
      </div>
    </div>
  )
}

