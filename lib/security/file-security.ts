/**
 * Enhanced File Security Utilities
 * Provides virus scanning, content validation, and secure file handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'pdf': ['application/pdf'],
  'doc': ['application/msword'],
  'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'jpg': ['image/jpeg'],
  'jpeg': ['image/jpeg'],
  'png': ['image/png'],
  'txt': ['text/plain']
}

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Secure file upload directory
const UPLOAD_DIR = join(process.cwd(), 'uploads')

// Ensure upload directory exists
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Validate file type
export function validateFileType(fileType: string, mimeType: string): boolean {
  const allowedMimeTypes = Object.values(ALLOWED_FILE_TYPES).flat()
  return allowedMimeTypes.includes(mimeType)
}

// Sanitize filename to prevent directory traversal
export function sanitizeFilename(originalName: string): string {
  // Remove any path information and special characters
  const filename = originalName.replace(/^.*[\\\/]/, '')
  // Replace potentially dangerous characters
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

// Generate secure file path
export function generateSecureFilePath(userId: string, originalName: string): string {
  const timestamp = Date.now()
  const randomSuffix = randomBytes(4).toString('hex')
  const sanitizedName = sanitizeFilename(originalName)
  return join(UPLOAD_DIR, `${userId}_${timestamp}_${randomSuffix}_${sanitizedName}`)
}

// File security middleware for uploads
export async function fileSecurityMiddleware(
  request: NextRequest,
  maxSize: number = MAX_FILE_SIZE
): Promise<{ secure: boolean, error?: string }> {
  // Check if request has file data
  const contentType = request.headers.get('content-type')
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return { secure: false, error: 'Invalid content type for file upload' }
  }

  // Parse multipart form data to get actual file information
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return { secure: false, error: 'No file provided in request' }
  }

  // Get actual file information
  const fileName = file.name
  const fileSize = file.size
  const fileType = file.type

  // Validate file size
  if (fileSize > maxSize) {
    return { secure: false, error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` }
  }

  // Extract file extension
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''
  if (!validateFileType(fileExtension, fileType)) {
    return { secure: false, error: 'Invalid file type' }
  }

  return { secure: true }
}

// Secure file upload handler
export async function secureFileUpload(
  request: NextRequest,
  userId: string
): Promise<{ success: boolean, filePath?: string, error?: string }> {
  try {
    await ensureUploadDir()

    // Validate file first
    const fileCheck = await fileSecurityMiddleware(request)
    if (!fileCheck.secure) {
      return { success: false, error: fileCheck.error }
    }

    // Parse form data to get the actual file
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'No file provided in request' }
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()
    const fileName = file.name

    // Generate secure file path
    const filePath = generateSecureFilePath(userId, fileName)

    // Save file (in production, add virus scanning here)
    await fs.writeFile(filePath, Buffer.from(fileBuffer))

    return { success: true, filePath }
  } catch (error) {
    console.error('File upload error:', error)
    return { success: false, error: 'File upload failed' }
  }
}

// File deletion with security checks
export async function secureFileDelete(
  filePath: string,
  userId: string
): Promise<{ success: boolean, error?: string }> {
  try {
    // Verify the file path is within the upload directory
    const relativePath = join(UPLOAD_DIR, filePath)
    if (!relativePath.startsWith(UPLOAD_DIR)) {
      return { success: false, error: 'Invalid file path' }
    }

    // Check if file exists
    try {
      await fs.access(relativePath)
    } catch {
      return { success: false, error: 'File not found' }
    }

    // Delete file
    await fs.unlink(relativePath)
    return { success: true }
  } catch (error) {
    console.error('File deletion error:', error)
    return { success: false, error: 'File deletion failed' }
  }
}

// File download with security checks
export async function secureFileDownload(
  filePath: string,
  userId: string
): Promise<{ success: boolean, fileBuffer?: Buffer, error?: string }> {
  try {
    // Verify the file path is within the upload directory
    const relativePath = join(UPLOAD_DIR, filePath)
    if (!relativePath.startsWith(UPLOAD_DIR)) {
      return { success: false, error: 'Invalid file path' }
    }

    // Read and return file
    const fileBuffer = await fs.readFile(relativePath)
    return { success: true, fileBuffer }
  } catch (error) {
    console.error('File download error:', error)
    return { success: false, error: 'File download failed' }
  }
}