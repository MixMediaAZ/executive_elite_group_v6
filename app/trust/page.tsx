import Link from 'next/link'
import Image from 'next/image'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function TrustPage() {
  const session = await getServerSessionHelper()

  return (
    <div 
      className="min-h-screen bg-gray-50 relative overflow-x-hidden"
      style={{
        backgroundImage: 'url(/wallpaper.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      }}
    >
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-md border-b-2 border-eeg-blue-electric shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 sm:space-x-4 group">
                <Image 
                  src="/logo.jpg" 
                  alt="Executive Elite Group" 
                  width={200}
                  height={80}
                  className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-eeg-charcoal">Executive Elite Group</span>
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
                href="/auth/register?role=candidate"
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:from-eeg-blue-600 hover:to-eeg-blue-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px] flex items-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-eeg-charcoal mb-4">Trust & Fairness Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transparency and ethical AI use are at the core of our platform. 
            Learn how we protect your data and ensure fair treatment for all users.
          </p>
        </div>

        <div className="space-y-12">
          {/* How We Use AI */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-serif text-eeg-charcoal mb-6">How We Use AI</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">We Use AI To:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Help employers draft better job descriptions and outreach messages</li>
                  <li>Suggest relevant roles to candidates based on their skills and preferences</li>
                  <li>Provide transparent explanations for why positions are recommended</li>
                  <li>Improve the overall user experience through intelligent matching</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">We Do NOT Use AI To:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Make final hiring or promotion decisions</li>
                  <li>Scrape or analyze private communications (emails, Slack, etc.)</li>
                  <li>Assess personality traits from writing samples</li>
                  <li>Store or use protected characteristics for matching or ranking</li>
                  <li>Automatically reject any candidate without human review</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">
                  <strong>Human oversight always applies.</strong> AI suggests, but humans decide. 
                  Every recommendation includes an explanation and can be overridden.
                </p>
              </div>
            </div>
          </section>

          {/* Your Data & Privacy */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-serif text-eeg-charcoal mb-6">Your Data & Privacy</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Data We Collect</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Profile information you explicitly provide (work history, skills, preferences)</li>
                  <li>Job applications and related communications</li>
                  <li>Usage data (job views, profile interactions, search patterns)</li>
                  <li>Technical information (browser type, device, IP address for security)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Protection</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>We never sell your personal data to third parties</li>
                  <li>All data is encrypted in transit and at rest</li>
                  <li>You can request deletion of your account and data at any time</li>
                  <li>We comply with GDPR, CCPA, and other applicable privacy regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Fairness & Bias */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-serif text-eeg-charcoal mb-6">Fairness & Bias Prevention</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Commitment to Fairness</h3>
                <p className="text-gray-700 mb-4">
                  We are committed to preventing bias in our AI systems and ensuring equal opportunities 
                  for all candidates, regardless of background, demographics, or other protected characteristics.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Don&apos;t Use</h3>
                <p className="text-gray-700 mb-4">
                  Our matching algorithms explicitly avoid using:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Race, ethnicity, or national origin</li>
                  <li>Gender or gender identity</li>
                  <li>Age or date of birth</li>
                  <li>Disability status or health information</li>
                  <li>Sexual orientation or relationship status</li>
                  <li>Religious beliefs or practices</li>
                  <li>Political affiliations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Do Use</h3>
                <p className="text-gray-700 mb-4">
                  Our matching is based solely on:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Role-related skills and competencies</li>
                  <li>Professional level and experience</li>
                  <li>Industry specialties and settings</li>
                  <li>Geographic preferences and location</li>
                  <li>Compensation expectations</li>
                  <li>Availability and work preferences</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Regular Auditing</h4>
                <p className="text-green-700">
                  We conduct regular audits of our AI systems to check for unintended bias and 
                  maintain detailed logs of all AI-assisted decisions for transparency.
                </p>
              </div>
            </div>
          </section>

          {/* Audit & Transparency */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-serif text-eeg-charcoal mb-6">Audit & Transparency</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Why This Match?</h3>
                <p className="text-gray-700 mb-4">
                  Every AI-suggested match includes a clear explanation of why it was recommended. 
                  You&apos;ll see factors like:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>&quot;Your experience in hospice care aligns with this position&quot;</li>
                  <li>&quot;Your VP-level experience matches the role requirements&quot;</li>
                  <li>&quot;Your location preferences include this metropolitan area&quot;</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Audit Logging</h3>
                <p className="text-gray-700 mb-4">
                  We maintain detailed audit logs that record:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>What type of AI assistance was provided</li>
                  <li>What data was used (non-sensitive information only)</li>
                  <li>The recommendations made and their scores</li>
                  <li>Who requested the assistance and when</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact & Questions */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-serif text-eeg-charcoal mb-6">Questions or Concerns?</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                We&apos;re committed to transparency and welcome your questions about our AI practices, 
                data handling, or fairness measures.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:trust@executiveelitegroup.com"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-eeg-blue-electric hover:bg-eeg-blue-600 transition-colors"
                >
                  Email Our Trust Team
                </a>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      </div>
    </div>
  )
}
