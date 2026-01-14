import { validateResumeUpload } from '@/lib/security/upload-validator'

function makeFile(name: string, type: string, bytes: Uint8Array): File {
  // Node 20 has File/Blob
  const blob = new Blob([bytes], { type })
  // @ts-expect-error - File ctor exists in Node runtime used by Next/Jest
  return new File([blob], name, { type })
}

describe('validateResumeUpload', () => {
  test('rejects empty file', async () => {
    const file = makeFile('a.pdf', 'application/pdf', new Uint8Array([]))
    await expect(
      validateResumeUpload({ candidateProfileId: 'cand1', file })
    ).rejects.toThrow('Empty file')
  })

  test('accepts pdf-like file by mime', async () => {
    // Minimal PDF header bytes: "%PDF-"
    const bytes = new TextEncoder().encode('%PDF-1.4\n')
    const file = makeFile('resume.pdf', 'application/pdf', bytes)
    const v = await validateResumeUpload({ candidateProfileId: 'cand1', file })
    expect(v.storedFileName).toContain('cand1_')
    expect(v.mimeType).toBeTruthy()
    expect(v.size).toBeGreaterThan(0)
  })

  test('rejects disallowed extension', async () => {
    const bytes = new TextEncoder().encode('not a resume')
    const file = makeFile('resume.exe', 'application/octet-stream', bytes)
    await expect(
      validateResumeUpload({ candidateProfileId: 'cand1', file })
    ).rejects.toThrow('Invalid file type')
  })
})

