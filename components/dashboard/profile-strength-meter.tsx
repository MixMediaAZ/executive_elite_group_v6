import Link from 'next/link'
import type { ProfileCompleteness } from '@/lib/profile-completeness'

interface ProfileStrengthMeterProps {
  completeness: ProfileCompleteness
}

/**
 * Visual profile-completeness bar with a single suggested next step.
 * Server-component safe.
 */
export default function ProfileStrengthMeter({ completeness }: ProfileStrengthMeterProps) {
  const { score, nextStep } = completeness

  const barColor =
    score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-neutral-600">Profile Strength</h3>
        <span className="text-sm font-bold text-eeg-charcoal">{score}%</span>
      </div>
      <div
        className="mt-3 h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completeness"
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {nextStep ? (
        <p className="mt-3 text-sm text-neutral-600">
          Next:{' '}
          <Link
            href="/dashboard/profile"
            className="font-medium text-eeg-blue-electric hover:text-eeg-blue-600"
          >
            {nextStep.label}
          </Link>{' '}
          <span className="text-neutral-400">(+{nextStep.weight}%)</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-green-600 font-medium">
          Your profile is complete — great job!
        </p>
      )}
    </div>
  )
}
