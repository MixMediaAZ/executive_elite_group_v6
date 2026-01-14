/**
 * Common Validation Schemas
 * Centralized Zod schemas for API route validation
 */

import { z } from 'zod'

// Common field schemas
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const uuidSchema = z.string().uuid('Invalid ID format')
export const stringIdSchema = z.string().min(1, 'ID is required')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['CANDIDATE', 'EMPLOYER']),
})

// Job schemas
export const jobLevelSchema = z.enum(['C_SUITE', 'VP', 'DIRECTOR', 'MANAGER', 'OTHER_EXECUTIVE'])

export const jobCreateSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  level: jobLevelSchema,
  orgNameOverride: z.string().optional().nullable(),
  location: z.string().min(1, 'Location is required'),
  remoteAllowed: z.boolean().default(false),
  compensationMin: z.number().optional().nullable(),
  compensationMax: z.number().optional().nullable(),
  compensationCurrency: z.string().optional().nullable(),
  descriptionRich: z.string().min(1, 'Job description is required'),
  keyResponsibilitiesJson: z.string().optional().nullable(),
  requiredExperienceYears: z.number().optional().nullable(),
  requiredLicensesJson: z.string().optional().nullable(),
  requiredCertificationsJson: z.string().optional().nullable(),
  requiredEhrExperienceJson: z.string().optional().nullable(),
  requiredSettingExperienceJson: z.string().optional().nullable(),
  tierId: stringIdSchema,
  // Legacy fields for backward compatibility
  department: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCountry: z.string().optional(),
  hybridAllowed: z.boolean().optional(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
})

export const jobUpdateSchema = jobCreateSchema.partial()

// Message schemas
export const messageTypeSchema = z.enum([
  'APPLICATION_INQUIRY',
  'GENERAL_INQUIRY',
  'INTERVIEW_FOLLOWUP',
  'OFFER_DISCUSSION',
])

export const sendMessageSchema = z.object({
  recipientId: stringIdSchema,
  applicationId: z.string().optional(),
  type: messageTypeSchema,
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  parentMessageId: z.string().optional(),
})

export const messagesQuerySchema = z.object({
  folder: z.enum(['inbox', 'sent']).optional().default('inbox'),
  applicationId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

// Application schemas
export const applicationCreateSchema = z.object({
  jobId: stringIdSchema,
  candidateNote: z.string().optional(),
})

// Profile schemas
export const candidateProfileUpdateSchema = z.object({
  fullName: z.string().optional(),
  currentTitle: z.string().optional().nullable(),
  currentOrg: z.string().optional().nullable(),
  primaryLocation: z.string().optional().nullable(),
  willingToRelocate: z.boolean().optional(),
  relocationRegionsJson: z.string().optional(),
  preferredSettingsJson: z.string().optional(),
  preferredEmploymentType: z.string().optional().nullable(),
  targetLevelsJson: z.string().optional(),
  budgetManagedMin: z.number().optional(),
  budgetManagedMax: z.number().optional(),
  teamSizeMin: z.number().optional(),
  teamSizeMax: z.number().optional(),
  primaryServiceLinesJson: z.string().optional(),
  ehrExperienceJson: z.string().optional(),
  regulatoryExperienceJson: z.string().optional(),
  summary: z.string().optional().nullable(),
  // Legacy fields for backward compatibility
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
})

export const employerProfileUpdateSchema = z.object({
  orgName: z.string().optional(),
  orgType: z.string().optional(),
  hqLocation: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  about: z.string().optional().nullable(),
  // Legacy fields for backward compatibility
  organizationName: z.string().optional(),
  websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
  description: z.string().optional(),
  headquartersCity: z.string().optional(),
  headquartersState: z.string().optional(),
})

