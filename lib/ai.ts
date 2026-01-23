/**
 * AI Module - OpenAI Integration for Healthcare Executive Recruitment
 * 
 * This module provides comprehensive AI capabilities for the job matching platform
 * including job description generation, candidate matching, resume analysis,
 * and intelligent insights.
 */

import OpenAI from 'openai'
import { requireEnv } from '@/lib/env'
import { db } from '@/lib/db'
import { logger } from '@/lib/monitoring/logger'
import { openAiJson } from '@/lib/ai/openai-json'

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient
  openaiClient = new OpenAI({
    apiKey: requireEnv('OPENAI_API_KEY'),
  })
  return openaiClient
}

function getModel(): string {
  // Prefer a modern, widely-available default model; allow override via env.
  return process.env.OPENAI_MODEL || 'gpt-4o-mini'
}

// Enhanced interfaces for AI operations
export interface JobDescriptionInput {
  title: string
  level: string
  location: string
  remoteAllowed: boolean
  serviceLines?: string[]
  mustHaveSkills?: string[]
  cultureMandate?: string
  orgName?: string
  orgType?: string
  budgetManaged?: number
  teamSize?: number
}

export interface JobDescriptionOutput {
  jobDescription: string
  keyResponsibilities: string[]
  outreachSnippet: string
  skillsAnalysis: string
  marketInsights: string
}

export interface CandidateMatchingInput {
  candidateProfileId: string
  jobId?: string
  limit?: number
}

export interface JobMatchingInput {
  jobId: string
  limit?: number
}

export interface MatchResult {
  candidateId: string
  jobId: string
  matchScore: number
  matchingFactors: string[]
  missingRequirements: string[]
  recommendation: string
}

export interface ResumeAnalysisInput {
  resumeText: string
  candidateProfileId: string
}

export interface ResumeAnalysisOutput {
  extractedSkills: string[]
  experienceLevel: string
  industryFocus: string
  certifications: string[]
  leadershipExperience: string
  careerTrajectory: string
  aiSummary: string
  suggestedJobLevels: string[]
  recommendedServiceLines: string[]
}

export interface InterviewQuestionInput {
  jobId: string
  candidateProfileId: string
  questionCount?: number
}

export interface InterviewQuestionOutput {
  questions: Array<{
    question: string
    type: 'behavioral' | 'technical' | 'situational' | 'experience'
    focus: string
    followUp?: string
  }>
  evaluationCriteria: string[]
  redFlags: string[]
}

export interface ApplicationScreeningInput {
  candidateProfileId: string
  jobId: string
  applicationText?: string
}

export interface ApplicationScreeningOutput {
  fitScore: number
  strengths: string[]
  concerns: string[]
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'PASS'
  keyReasons: string[]
  suggestedInterviewFocus: string[]
}

/**
 * Enhanced job description generation with OpenAI
 */
export async function generateJobDescriptionAndOutreach(
  input: JobDescriptionInput
): Promise<JobDescriptionOutput> {
  try {
    const prompt = `
Create a comprehensive job description for a healthcare executive position with the following details:

Position: ${input.title}
Level: ${input.level}
Location: ${input.location}
Remote Work: ${input.remoteAllowed ? 'Yes' : 'No'}
Organization: ${input.orgName || 'Healthcare Organization'}
Organization Type: ${input.orgType || 'Healthcare System'}
Service Lines: ${input.serviceLines?.join(', ') || 'Healthcare Operations'}
Required Skills: ${input.mustHaveSkills?.join(', ') || 'Leadership and Management'}
Culture Focus: ${input.cultureMandate || 'Excellence in Healthcare'}
Budget Responsibility: ${input.budgetManaged ? `$${input.budgetManaged.toLocaleString()}` : 'Strategic Budget Management'}
Team Size: ${input.teamSize ? `${input.teamSize} people` : 'Cross-functional Teams'}

Please provide:
1. A detailed, engaging job description (500-700 words)
2. 6-8 key responsibilities
3. A personalized outreach message for potential candidates
4. A brief skills analysis
5. Market insights for this role

Format as JSON with keys: jobDescription, keyResponsibilities, outreachSnippet, skillsAnalysis, marketInsights
`

    const result = await openAiJson<{
      jobDescription: string
      keyResponsibilities: string[]
      outreachSnippet: string
      skillsAnalysis: string
      marketInsights: string
    }>(getOpenAI(), {
      model: getModel(),
      system:
        'You are an expert healthcare executive recruiter with 20+ years of experience. Create compelling, professional job descriptions that attract top-tier healthcare leadership talent. Always return valid JSON.',
      user: prompt,
      temperature: 0.7,
      maxTokens: 2000,
      timeoutMs: 30_000,
      retries: 2,
    })
    
    // Log AI operation
    await logAIOperation('job_description_generated', null, {
      jobTitle: input.title,
      level: input.level,
      orgType: input.orgType
    })

    return {
      jobDescription: result.jobDescription,
      keyResponsibilities: result.keyResponsibilities,
      outreachSnippet: result.outreachSnippet,
      skillsAnalysis: result.skillsAnalysis,
      marketInsights: result.marketInsights
    }
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error generating job description'
    )
    throw new Error('Failed to generate job description with AI')
  }
}

/**
 * Intelligent candidate-job matching system
 */
export async function findMatchesForCandidate(
  input: CandidateMatchingInput
): Promise<MatchResult[]> {
  try {
    // Get candidate profile
    const candidate = await db.candidateProfile.findUnique({
      where: { id: input.candidateProfileId },
      include: {
        user: true,
        applications: {
          include: { job: true }
        }
      }
    })

    if (!candidate) {
      throw new Error('Candidate profile not found')
    }

    // Get available jobs
    const jobs = await db.job.findMany({
      where: { 
        // Jobs are applied-to only when LIVE; match against LIVE jobs.
        status: 'LIVE',
        ...(input.jobId && { id: input.jobId })
      },
      include: {
        employer: true,
        tier: true
      },
      take: input.limit || 20
    })

    const matches: MatchResult[] = []

    for (const job of jobs) {
      // Prepare data for AI analysis
      const candidateData = {
        currentTitle: candidate.currentTitle,
        currentOrg: candidate.currentOrg,
        targetLevels: JSON.parse(candidate.targetLevelsJson || '[]'),
        preferredSettings: JSON.parse(candidate.preferredSettingsJson || '[]'),
        serviceLines: JSON.parse(candidate.primaryServiceLinesJson || '[]'),
        budgetManaged: candidate.budgetManagedMin,
        teamSize: candidate.teamSizeMin,
        summary: candidate.summary
      }

      const jobData = {
        title: job.title,
        level: job.level,
        orgType: job.employer.orgType,
        description: job.descriptionRich,
        requiredExperience: job.requiredExperienceYears,
        compensation: job.compensationMax
      }

      const prompt = `
Analyze the job match between this candidate and job:

CANDIDATE PROFILE:
- Current Title: ${candidateData.currentTitle}
- Current Organization: ${candidateData.currentOrg}
- Target Levels: ${candidateData.targetLevels.join(', ')}
- Preferred Settings: ${candidateData.preferredSettings.join(', ')}
- Service Lines: ${candidateData.serviceLines.join(', ')}
- Budget Managed: ${candidateData.budgetManaged ? `$${candidateData.budgetManaged.toLocaleString()}` : 'Not specified'}
- Team Size: ${candidateData.teamSize || 'Not specified'}
- Summary: ${candidateData.summary}

JOB DETAILS:
- Title: ${jobData.title}
- Level: ${jobData.level}
- Organization Type: ${jobData.orgType}
- Required Experience: ${jobData.requiredExperience || 'Not specified'} years
- Max Compensation: ${jobData.compensation ? `$${jobData.compensation.toLocaleString()}` : 'Not specified'}
- Description: ${jobData.description.substring(0, 500)}...

Provide analysis as JSON with:
- matchScore (0-100)
- matchingFactors (array of strings)
- missingRequirements (array of strings)
- recommendation (string)

Focus on: role alignment, experience level, skills match, cultural fit, and growth potential.
`

      const analysis = await openAiJson<{
        matchScore: number
        matchingFactors: string[]
        missingRequirements: string[]
        recommendation: string
      }>(getOpenAI(), {
        model: getModel(),
        system:
          'You are an expert healthcare executive recruiter. Analyze candidate-job matches with precision and provide actionable insights. Always return valid JSON.',
        user: prompt,
        temperature: 0.3,
        maxTokens: 900,
        timeoutMs: 30_000,
        retries: 2,
      })

      matches.push({
        candidateId: input.candidateProfileId,
        jobId: job.id,
        matchScore: analysis.matchScore,
        matchingFactors: analysis.matchingFactors,
        missingRequirements: analysis.missingRequirements,
        recommendation: analysis.recommendation,
      })
    }

    // Sort by match score and log operation
    matches.sort((a, b) => b.matchScore - a.matchScore)
    
    await logAIOperation('candidate_matching', candidate.userId, {
      candidateId: input.candidateProfileId,
      matchesGenerated: matches.length,
      topScore: matches[0]?.matchScore || 0
    })

    return matches
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error in candidate matching'
    )
    throw new Error('Failed to generate candidate matches')
  }
}

/**
 * Find matching candidates for a job using AI analysis
 */
export async function findMatchesForJob(
  input: JobMatchingInput
): Promise<MatchResult[]> {
  try {
    // Get job with employer details
    const job = await db.job.findUnique({
      where: { id: input.jobId },
      include: {
        employer: true,
        tier: true,
        applications: {
          select: { candidateId: true }
        }
      }
    })

    if (!job) {
      throw new Error('Job not found')
    }

    if (job.status !== 'LIVE') {
      throw new Error('Job must be LIVE to find matches')
    }

    // Get candidate profiles (exclude those who already applied)
    const appliedCandidateIds = job.applications.map(app => app.candidateId)
    
    const candidates = await db.candidateProfile.findMany({
      where: {
        ...(appliedCandidateIds.length > 0 && {
          id: { notIn: appliedCandidateIds }
        })
      },
      include: {
        user: true
      },
      take: input.limit || 20
    })

    const matches: MatchResult[] = []

    for (const candidate of candidates) {
      // Prepare data for AI analysis
      const jobData = {
        title: job.title,
        level: job.level,
        orgType: job.employer.orgType,
        description: job.descriptionRich,
        requiredExperience: job.requiredExperienceYears,
        compensationMin: job.compensationMin,
        compensationMax: job.compensationMax,
        location: job.location,
        remoteAllowed: job.remoteAllowed
      }

      const candidateData = {
        currentTitle: candidate.currentTitle,
        currentOrg: candidate.currentOrg,
        targetLevels: JSON.parse(candidate.targetLevelsJson || '[]'),
        preferredSettings: JSON.parse(candidate.preferredSettingsJson || '[]'),
        serviceLines: JSON.parse(candidate.primaryServiceLinesJson || '[]'),
        budgetManaged: candidate.budgetManagedMin,
        teamSize: candidate.teamSizeMin,
        summary: candidate.summary,
        location: candidate.primaryLocation,
        willingToRelocate: candidate.willingToRelocate
      }

      const prompt = `
Analyze the candidate match for this job:

JOB REQUIREMENTS:
- Title: ${jobData.title}
- Level: ${jobData.level}
- Organization Type: ${jobData.orgType}
- Required Experience: ${jobData.requiredExperience || 'Not specified'} years
- Location: ${jobData.location}
- Remote Allowed: ${jobData.remoteAllowed ? 'Yes' : 'No'}
- Compensation: ${jobData.compensationMin && jobData.compensationMax 
  ? `$${jobData.compensationMin.toLocaleString()} - $${jobData.compensationMax.toLocaleString()}` 
  : jobData.compensationMax 
    ? `Up to $${jobData.compensationMax.toLocaleString()}`
    : 'Not specified'}
- Description: ${jobData.description.substring(0, 500)}${jobData.description.length > 500 ? '...' : ''}

CANDIDATE PROFILE:
- Current Title: ${candidateData.currentTitle || 'Not specified'}
- Current Organization: ${candidateData.currentOrg || 'Not specified'}
- Target Levels: ${candidateData.targetLevels.length > 0 ? candidateData.targetLevels.join(', ') : 'Not specified'}
- Preferred Settings: ${candidateData.preferredSettings.length > 0 ? candidateData.preferredSettings.join(', ') : 'Not specified'}
- Service Lines: ${candidateData.serviceLines.length > 0 ? candidateData.serviceLines.join(', ') : 'Not specified'}
- Budget Managed: ${candidateData.budgetManaged ? `$${candidateData.budgetManaged.toLocaleString()}` : 'Not specified'}
- Team Size: ${candidateData.teamSize || 'Not specified'}
- Location: ${candidateData.location || 'Not specified'}
- Willing to Relocate: ${candidateData.willingToRelocate ? 'Yes' : 'No'}
- Summary: ${candidateData.summary || 'Not provided'}

Provide analysis as JSON with:
- matchScore (0-100)
- matchingFactors (array of strings)
- missingRequirements (array of strings)
- recommendation (STRONG_HIRE/HIRE/MAYBE/PASS)

Focus on: candidate qualifications vs job requirements, experience level match, skills alignment, location compatibility, and growth potential.
`

      const analysis = await openAiJson<{
        matchScore: number
        matchingFactors: string[]
        missingRequirements: string[]
        recommendation: string
      }>(getOpenAI(), {
        model: getModel(),
        system:
          'You are an expert healthcare executive recruiter. Analyze candidate-job matches with precision and provide actionable insights. Always return valid JSON.',
        user: prompt,
        temperature: 0.3,
        maxTokens: 900,
        timeoutMs: 30_000,
        retries: 2,
      })

      matches.push({
        candidateId: candidate.id,
        jobId: input.jobId,
        matchScore: analysis.matchScore,
        matchingFactors: analysis.matchingFactors,
        missingRequirements: analysis.missingRequirements,
        recommendation: analysis.recommendation,
      })
    }

    // Sort by match score and log operation
    matches.sort((a, b) => b.matchScore - a.matchScore)
    
    await logAIOperation('job_matching', job.employer.userId, {
      jobId: input.jobId,
      matchesGenerated: matches.length,
      topScore: matches[0]?.matchScore || 0
    })

    return matches
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error in job matching'
    )
    throw new Error('Failed to generate job matches')
  }
}

/**
 * Advanced resume analysis and parsing
 */
export async function analyzeResume(
  input: ResumeAnalysisInput
): Promise<ResumeAnalysisOutput> {
  try {
    const prompt = `
Analyze this healthcare executive resume and provide comprehensive insights:

RESUME TEXT:
${input.resumeText}

Please provide detailed analysis as JSON with:
- extractedSkills (array of technical and leadership skills)
- experienceLevel (Junior/Mid/Senior/Executive/C-Suite)
- industryFocus (primary healthcare sectors)
- certifications (array of relevant certifications)
- leadershipExperience (description of leadership background)
- careerTrajectory (analysis of career progression)
- aiSummary (comprehensive 2-3 sentence summary)
- suggestedJobLevels (array of appropriate job levels)
- recommendedServiceLines (array of healthcare service lines)

Focus on healthcare leadership experience, management capabilities, and executive potential.
`

    const analysis = await openAiJson<any>(getOpenAI(), {
      model: getModel(),
      system:
        'You are an expert healthcare executive recruiter and resume analyst. Provide thorough, accurate analysis of healthcare leadership experience. Always return valid JSON.',
      user: prompt,
      temperature: 0.4,
      maxTokens: 1500,
      timeoutMs: 30_000,
      retries: 2,
    })
    
    await logAIOperation('resume_analysis', null, {
      candidateProfileId: input.candidateProfileId,
      resumeLength: input.resumeText.length,
      experienceLevel: analysis.experienceLevel
    })

    return {
      extractedSkills: analysis.extractedSkills || [],
      experienceLevel: analysis.experienceLevel,
      industryFocus: analysis.industryFocus,
      certifications: analysis.certifications || [],
      leadershipExperience: analysis.leadershipExperience,
      careerTrajectory: analysis.careerTrajectory,
      aiSummary: analysis.aiSummary,
      suggestedJobLevels: analysis.suggestedJobLevels || [],
      recommendedServiceLines: analysis.recommendedServiceLines || []
    }
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error analyzing resume'
    )
    throw new Error('Failed to analyze resume with AI')
  }
}

/**
 * Generate intelligent interview questions
 */
export async function generateInterviewQuestions(
  input: InterviewQuestionInput
): Promise<InterviewQuestionOutput> {
  try {
    // Get job and candidate details
    const [job, candidate] = await Promise.all([
      db.job.findUnique({
        where: { id: input.jobId },
        include: { employer: true }
      }),
      db.candidateProfile.findUnique({
        where: { id: input.candidateProfileId }
      })
    ])

    if (!job || !candidate) {
      throw new Error('Job or candidate profile not found')
    }

    const candidateData = {
      currentTitle: candidate.currentTitle,
      currentOrg: candidate.currentOrg,
      summary: candidate.summary,
      serviceLines: JSON.parse(candidate.primaryServiceLinesJson || '[]')
    }

    const prompt = `
Create interview questions for this healthcare executive position:

JOB DETAILS:
- Title: ${job.title}
- Level: ${job.level}
- Organization: ${job.employer.orgName}
- Organization Type: ${job.employer.orgType}
- Key Responsibilities: ${JSON.parse(job.keyResponsibilitiesJson || '[]').join(', ')}

CANDIDATE BACKGROUND:
- Current Role: ${candidateData.currentTitle}
- Current Organization: ${candidateData.currentOrg}
- Service Lines: ${candidateData.serviceLines.join(', ')}
- Background: ${candidateData.summary}

Create ${input.questionCount || 8} strategic interview questions as JSON with:
- questions (array of {question, type, focus, followUp})
- evaluationCriteria (array of what to look for)
- redFlags (array of warning signs)

Question types: behavioral, technical, situational, experience
Focus areas: leadership, healthcare expertise, strategic thinking, cultural fit
`

    const result = await openAiJson<any>(getOpenAI(), {
      model: getModel(),
      system:
        'You are an expert healthcare executive recruiter and interviewer. Create insightful, strategic questions that reveal leadership capabilities and cultural fit. Always return valid JSON.',
      user: prompt,
      temperature: 0.6,
      maxTokens: 1200,
      timeoutMs: 30_000,
      retries: 2,
    })
    
    await logAIOperation('interview_questions_generated', null, {
      jobId: input.jobId,
      candidateId: input.candidateProfileId,
      questionCount: result.questions?.length || 0
    })

    return {
      questions: result.questions || [],
      evaluationCriteria: result.evaluationCriteria || [],
      redFlags: result.redFlags || []
    }
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error generating interview questions'
    )
    throw new Error('Failed to generate interview questions with AI')
  }
}

/**
 * Automated application screening
 */
export async function screenApplication(
  input: ApplicationScreeningInput
): Promise<ApplicationScreeningOutput> {
  try {
    const [candidate, job] = await Promise.all([
      db.candidateProfile.findUnique({
        where: { id: input.candidateProfileId },
        include: { user: true }
      }),
      db.job.findUnique({
        where: { id: input.jobId },
        include: { employer: true }
      })
    ])

    if (!candidate || !job) {
      throw new Error('Candidate or job not found')
    }

    const prompt = `
Screen this job application for fit and potential:

CANDIDATE PROFILE:
- Name: ${candidate.fullName}
- Current Title: ${candidate.currentTitle}
- Current Org: ${candidate.currentOrg}
- Target Levels: ${JSON.parse(candidate.targetLevelsJson || '[]').join(', ')}
- Experience: ${candidate.summary}

JOB DETAILS:
- Title: ${job.title}
- Level: ${job.level}
- Required Experience: ${job.requiredExperienceYears ?? 'Not specified'} years
- Organization: ${job.employer.orgName} (${job.employer.orgType})

APPLICATION NOTE:
${input.applicationText || 'No additional note provided'}

Provide screening analysis as JSON with:
- fitScore (0-100)
- strengths (array of candidate strengths)
- concerns (array of potential concerns)
- recommendation (STRONG_HIRE/HIRE/MAYBE/PASS)
- keyReasons (array of main reasons for recommendation)
- suggestedInterviewFocus (array of areas to explore in interview)

Be objective and thorough in evaluation.
`

    const result = await openAiJson<any>(getOpenAI(), {
      model: getModel(),
      system:
        'You are an expert healthcare executive recruiter screening applications. Provide fair, detailed, and actionable screening assessments. Always return valid JSON.',
      user: prompt,
      temperature: 0.3,
      maxTokens: 1000,
      timeoutMs: 30_000,
      retries: 2,
    })
    
    await logAIOperation('application_screening', candidate.userId, {
      candidateId: input.candidateProfileId,
      jobId: input.jobId,
      fitScore: result.fitScore,
      recommendation: result.recommendation
    })

    return {
      fitScore: result.fitScore,
      strengths: result.strengths || [],
      concerns: result.concerns || [],
      recommendation: result.recommendation,
      keyReasons: result.keyReasons || [],
      suggestedInterviewFocus: result.suggestedInterviewFocus || []
    }
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error screening application'
    )
    throw new Error('Failed to screen application with AI')
  }
}

/**
 * Get AI-powered market insights
 */
export async function getMarketInsights(
  orgType?: string,
  jobLevel?: string,
  location?: string
): Promise<{
  salaryRange: { min: number; max: number; currency: string }
  marketTrends: string[]
  inDemandSkills: string[]
  competitionLevel: 'Low' | 'Medium' | 'High'
  hiringTips: string[]
}> {
  try {
    const prompt = `
Provide healthcare executive market insights for:

Organization Type: ${orgType || 'Healthcare Systems'}
Job Level: ${jobLevel || 'Director level'}
Location: ${location || 'United States'}

Current Date: ${new Date().toISOString().split('T')[0]}

Provide insights as JSON with:
- salaryRange (min, max, currency)
- marketTrends (array of current trends)
- inDemandSkills (array of hot skills)
- competitionLevel (Low/Medium/High)
- hiringTips (array of actionable tips)

Focus on 2024-2025 market conditions and post-pandemic healthcare landscape.
`

    const result = await openAiJson<any>(getOpenAI(), {
      model: getModel(),
      system:
        'You are a healthcare market analyst with expertise in executive recruitment trends and compensation data. Always return valid JSON.',
      user: prompt,
      temperature: 0.4,
      maxTokens: 1000,
      timeoutMs: 30_000,
      retries: 2,
    })
    
    await logAIOperation('market_insights', null, {
      orgType,
      jobLevel,
      location
    })

    return result
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error getting market insights'
    )
    throw new Error('Failed to get market insights')
  }
}

/**
 * Log AI operation to analytics and audit logs
 */
export async function logAIOperation(
  eventType: string,
  userId: string | null,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    // Log to AnalyticsEvent
    await db.analyticsEvent.create({
      data: {
        eventType: `ai_${eventType}`,
        userId,
        metadataJson: JSON.stringify(metadata)
      }
    })

    // Log to AuditLog for admin visibility
    await db.auditLog.create({
      data: {
        actorUserId: userId,
        actionType: `ai_${eventType}`,
        targetType: 'AI_SYSTEM',
        detailsJson: JSON.stringify(metadata)
      }
    })
  } catch (error) {
    logger.warn(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error logging AI operation'
    )
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Check if AI features are properly configured
 */
export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

/**
 * Get AI usage statistics for admin dashboard
 */
export async function getAIUsageStats(): Promise<{
  totalOperations: number
  operationsByType: Record<string, number>
  recentActivity: Array<{
    type: string
    timestamp: Date
    userId?: string
  }>
}> {
  try {
    const recentEvents: Array<{ eventType: string; createdAt: Date; userId: string | null }> =
      await db.analyticsEvent.findMany({
      where: {
        eventType: {
          startsWith: 'ai_'
        }
      },
      select: {
        eventType: true,
        createdAt: true,
        userId: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    const operationsByType: Record<string, number> = {}
    recentEvents.forEach((event) => {
      const type = event.eventType.replace('ai_', '')
      operationsByType[type] = (operationsByType[type] || 0) + 1
    })

    return {
      totalOperations: recentEvents.length,
      operationsByType,
      recentActivity: recentEvents.map(event => ({
        type: event.eventType.replace('ai_', ''),
        timestamp: event.createdAt,
        userId: event.userId || undefined
      }))
    }
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) } },
      'Error getting AI usage stats'
    )
    return {
      totalOperations: 0,
      operationsByType: {},
      recentActivity: []
    }
  }
}
