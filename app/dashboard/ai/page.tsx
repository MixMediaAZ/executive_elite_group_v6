'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import TopNavigation from '@/components/top-navigation'
import DrawerNavigation from '@/components/drawer-navigation'
import { JobDescriptionGenerator } from '@/components/ai/job-description-generator'
import { CandidateMatcher } from '@/components/ai/candidate-matcher'
import { ResumeAnalyzer } from '@/components/ai/resume-analyzer'
import { InterviewQuestions } from '@/components/ai/interview-questions'
import { ApplicationScreening } from '@/components/ai/application-screening'
import { MarketInsights } from '@/components/ai/market-insights'
import { UsageStats } from '@/components/ai/usage-stats'

export default function AIDashboard() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  
  // #region agent log
  console.log('[AI DASHBOARD] Component render', { status, hasSession: !!session, hasUser: !!session?.user })
  // #endregion
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eeg-blue-electric mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!session?.user) {
    // #region agent log
    console.log('[AI DASHBOARD] No session, showing sign in message')
    // #endregion
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access the AI Dashboard</p>
        </div>
      </div>
    )
  }
  
  // #region agent log
  console.log('[AI DASHBOARD] Rendering dashboard', { userRole: session.user.role, userEmail: session.user.email })
  // #endregion

  // Color mapping for Tailwind classes (must be static for build-time processing)
  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
    red: { bg: 'bg-red-100', text: 'text-red-700' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  }

  const aiFeatures = [
    {
      id: 'job-description',
      title: 'Job Description Generator',
      icon: '📝',
      description: 'Generate compelling job descriptions and outreach messages using AI',
      color: 'blue',
      userTypes: ['employer']
    },
    {
      id: 'candidate-matching',
      title: 'Intelligent Matching',
      icon: '🎯',
      description: 'Find the best candidate-job matches using AI analysis',
      color: 'purple',
      userTypes: ['employer', 'candidate']
    },
    {
      id: 'resume-analysis',
      title: 'Resume Analysis',
      icon: '📄',
      description: 'Parse and analyze resumes to extract skills and experience',
      color: 'green',
      userTypes: ['candidate']
    },
    {
      id: 'interview-questions',
      title: 'Interview Generator',
      icon: '❓',
      description: 'Generate strategic interview questions for any role',
      color: 'orange',
      userTypes: ['employer']
    },
    {
      id: 'application-screening',
      title: 'Application Screening',
      icon: '🔍',
      description: 'Automatically screen and evaluate job applications',
      color: 'red',
      userTypes: ['employer']
    },
    {
      id: 'market-insights',
      title: 'Market Insights',
      icon: '📊',
      description: 'Get real-time market analysis and salary insights',
      color: 'indigo',
      userTypes: ['employer', 'candidate']
    },
    {
      id: 'usage-stats',
      title: 'Usage Analytics',
      icon: '📈',
      description: 'Monitor AI feature usage and platform performance',
      color: 'blue',
      userTypes: ['admin']
    }
  ]

  // Stats will be fetched from real data via API
  const stats: Array<{ label: string; value: string; change: string }> = []

  // Defensive checks for session data
  if (!session?.user?.role || !session?.user?.email) {
    // #region agent log
    console.error('[AI DASHBOARD] Invalid session data', { hasRole: !!session?.user?.role, hasEmail: !!session?.user?.email })
    // #endregion
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Session data is incomplete. Please sign in again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative eeg-wallpaper">
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="relative z-10 flex flex-col flex-1">
        <TopNavigation userRole={session.user.role} userEmail={session.user.email} />
        <div className="flex flex-1">
          <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
          <main className="flex-1 lg:ml-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Leverage artificial intelligence to enhance your recruitment process
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      AI Services Active
                    </span>
                  </div>
                </div>
              </div>
        {/* Stats Overview - Hidden until data is available */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'job-description', label: 'Job Description Generator' },
                { id: 'candidate-matching', label: 'Candidate Matching' },
                { id: 'resume-analysis', label: 'Resume Analysis' },
                { id: 'interview-questions', label: 'Interview Generator' },
                { id: 'application-screening', label: 'Application Screening' },
                { id: 'market-insights', label: 'Market Insights' },
                { id: 'usage-stats', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-eeg-blue-electric text-eeg-blue-electric'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* AI Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setActiveTab(feature.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[feature.color]?.bg || 'bg-gray-100'} ${colorClasses[feature.color]?.text || 'text-gray-700'}`}>
                      Active
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* AI Features Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">For Employers</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Generate compelling job descriptions</li>
                    <li>• Find top candidates automatically</li>
                    <li>• Screen applications intelligently</li>
                    <li>• Create strategic interview questions</li>
                    <li>• Get market insights and salary data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">For Candidates</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Analyze and optimize resumes</li>
                    <li>• Find matching job opportunities</li>
                    <li>• Get personalized job recommendations</li>
                    <li>• Receive career guidance insights</li>
                    <li>• Understand market positioning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'job-description' && <JobDescriptionGenerator />}
        {activeTab === 'candidate-matching' && <CandidateMatcher />}
        {activeTab === 'resume-analysis' && <ResumeAnalyzer />}
        {activeTab === 'interview-questions' && <InterviewQuestions />}
        {activeTab === 'application-screening' && <ApplicationScreening />}
        {activeTab === 'market-insights' && <MarketInsights />}
        {activeTab === 'usage-stats' && <UsageStats />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
