import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { validateResumeUpload } from '@/lib/security/upload-validator'
import { withApiHandler, successResponse, errorResponse } from '@/lib/api-helpers'
import { put } from '@vercel/blob'

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    if (session.user.role !== 'CANDIDATE') return errorResponse('Only candidates can upload resumes', 403)
    if (!session.user.candidateProfileId) return errorResponse('Candidate profile not found', 404)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return errorResponse('No file provided', 400)

    let validated: Awaited<ReturnType<typeof validateResumeUpload>>
    try {
      validated = await validateResumeUpload({
        candidateProfileId: session.user.candidateProfileId,
        file,
      })
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Invalid file upload', 400)
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'resumes')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const fileName = validated.storedFileName

    // Vercel: use Vercel Blob when configured (recommended; filesystem is ephemeral in serverless).
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`resumes/${fileName}`, validated.buffer, {
        access: 'public',
        contentType: validated.mimeType,
        addRandomSuffix: false,
      })

      return successResponse({
        fileUrl: blob.url,
        fileName: validated.originalFileName,
        fileMimeType: validated.mimeType,
        fileSize: validated.size,
      })
    }

    // If we're on Vercel but Blob isn't configured, fail clearly (otherwise uploads "work" but disappear).
    if (process.env.VERCEL === '1') {
      return errorResponse('Resume uploads are not configured. Please set BLOB_READ_WRITE_TOKEN for Vercel Blob.', 500)
    }

    const filePath = join(uploadsDir, fileName)

    // Local dev: save to filesystem under /public/resumes
    await writeFile(filePath, validated.buffer)

    // Return public URL (local dev)
    const fileUrl = `/resumes/${fileName}`

    return successResponse({
      fileUrl,
      fileName: validated.originalFileName,
      fileMimeType: validated.mimeType,
      fileSize: validated.size,
    })
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:resume-upload', limit: 10, windowSeconds: 60 },
  }
)

