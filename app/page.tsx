import Link from 'next/link'
import Image from 'next/image'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import HomeSearch from '@/components/home-search'

export default async function Home() {
  // Robust session check for Vercel production deployments
  // Only redirect if we have a valid session with all required fields
  let shouldRedirect = false
  
  try {
    const session = await getServerSessionHelper()
    // Only redirect to dashboard if we have a fully valid session
    // This prevents redirect loops on Vercel when session is partially invalid
    if (
      session &&
      session.user &&
      typeof session.user.id === 'string' &&
      session.user.id.length > 0 &&
      typeof session.user.email === 'string' &&
      session.user.email.length > 0 &&
      typeof session.user.role === 'string' &&
      session.user.role.length > 0
    ) {
      shouldRedirect = true
    }
  } catch (error) {
    // If auth fails, continue to show home page - do NOT redirect
    // This is critical for Vercel where auth may fail due to cold starts or config issues
    if (process.env.NODE_ENV === 'production') {
      console.error('[Home] Auth check error (showing public page):', error instanceof Error ? error.message : String(error))
    }
  }

  if (shouldRedirect) {
    redirect('/dashboard')
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 relative overflow-x-hidden"
      style={{
        backgroundImage: 'url(/wallpaper.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="relative z-10">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-md border-b-2 border-eeg-blue-electric shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 sm:space-x-4 group">
                <Image
                  src="/logo.jpg"
                  alt="Executive Elite Group"
                  className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-transform group-hover:scale-105"
                  width={200}
                  height={200}
                  priority
                />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-eeg-charcoal">Executive Elite Group</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/auth/login"
                className="px-4 sm:px-5 py-2.5 sm:py-3 text-eeg-charcoal hover:text-eeg-blue-electric transition-all font-semibold text-sm sm:text-base min-h-[44px] flex items-center hover:bg-eeg-blue-50 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/trust"
                className="px-4 sm:px-5 py-2.5 sm:py-3 text-eeg-charcoal hover:text-eeg-blue-electric transition-all font-semibold text-sm sm:text-base min-h-[44px] flex items-center hover:bg-eeg-blue-50 rounded-lg"
              >
                Trust & Fairness
              </Link>
              <Link
                href="/auth/register"
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:from-eeg-blue-600 hover:to-eeg-blue-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px] flex items-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Search First */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-eeg-charcoal mb-6 leading-tight px-4">
            Executive & Leadership Roles
            <br />
            <span className="text-eeg-gradient">in Healthcare</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto mb-4 px-4">
            The Executive Elite Group connects healthcare executives with premier opportunities.
          </p>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 px-4">
            AI-assisted matching, human-led decisions. Built for fairness and transparency.
          </p>
          
          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 px-4">
            <Link
              href="/auth/register?role=candidate"
              className="w-full sm:w-auto px-8 py-4 sm:py-3 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-base sm:text-lg min-h-[44px] flex items-center justify-center"
            >
              I&apos;m an Executive
            </Link>
            <Link
              href="/auth/register?role=employer"
              className="w-full sm:w-auto px-8 py-4 sm:py-3 bg-white border-2 border-eeg-blue-600 text-eeg-blue-600 rounded-lg font-semibold hover:bg-eeg-blue-50 transition-all text-base sm:text-lg min-h-[44px] flex items-center justify-center"
            >
              I&apos;m Hiring
            </Link>
          </div>
        </div>

        {/* Search Bar - Front and Center */}
        <HomeSearch />

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-eeg-charcoal mb-2">Executive Roles</h3>
            <p className="text-gray-600">C-Suite, VP, Director, and senior management positions across healthcare.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-eeg-charcoal mb-2">Verified Employers</h3>
            <p className="text-gray-600">Trusted healthcare organizations verified by our team.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-eeg-charcoal mb-2">Rapid Placement</h3>
            <p className="text-gray-600">Streamlined process connecting qualified candidates with opportunities.</p>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}
