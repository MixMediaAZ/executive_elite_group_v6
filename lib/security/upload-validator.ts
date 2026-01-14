import sanitize from 'sanitize-filename'

export type ValidatedUpload = {
  buffer: Buffer
  storedFileName: string
  originalFileName: string
  mimeType: string
  size: number
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx'])

function extFromName(name: string): string {
  const parts = name.split('.')
  if (parts.length < 2) return ''
  return parts[parts.length - 1].toLowerCase()
}

export async function validateResumeUpload(params: {
  candidateProfileId: string
  file: File
}): Promise<ValidatedUpload> {
  const { candidateProfileId, file } = params

  if (!file) {
    throw new Error('No file provided')
  }

  if (file.size <= 0) {
    throw new Error('Empty file')
  }

  if (file.size > MAX_RESUME_BYTES) {
    throw new Error('File size must be less than 5MB')
  }

  // Sanitize filename and extension
  const originalFileName = file.name || 'resume'
  const sanitized = sanitize(originalFileName).replace(/\s+/g, '_')
  const ext = extFromName(sanitized)
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Invalid file type. Please upload PDF or Word document.')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Verify actual type from magic bytes (do not trust client-sent mime).
  // We avoid depending on ESM-only detection libraries here to keep the server/tests simple.
  const clientMime = file.type

  const startsWith = (sig: number[]) =>
    buffer.length >= sig.length && sig.every((b, i) => buffer[i] === b)

  const isPdf = startsWith([0x25, 0x50, 0x44, 0x46, 0x2d]) // %PDF-
  const isOleDoc = startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) // OLE header
  const isZip = startsWith([0x50, 0x4b, 0x03, 0x04]) // PK\x03\x04 (docx is zip container)

  // Basic extension ↔ signature consistency checks
  if (ext === 'pdf' && !isPdf) {
    throw new Error('Invalid file content for PDF')
  }
  if (ext === 'doc' && !isOleDoc) {
    throw new Error('Invalid file content for DOC')
  }
  if (ext === 'docx' && !isZip) {
    throw new Error('Invalid file content for DOCX')
  }

  // If client mime is present, ensure it’s on the allowlist
  if (clientMime && !ALLOWED_MIME_TYPES.has(clientMime)) {
    throw new Error('Invalid file type. Please upload PDF or Word document.')
  }

  const effectiveMime =
    clientMime ||
    (ext === 'pdf'
      ? 'application/pdf'
      : ext === 'doc'
        ? 'application/msword'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

  const timestamp = Date.now()
  const storedFileName = `${candidateProfileId}_${timestamp}_${sanitized}`

  return {
    buffer,
    storedFileName,
    originalFileName,
    mimeType: effectiveMime,
    size: file.size,
  }
}

