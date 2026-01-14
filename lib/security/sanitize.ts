/**
 * Minimal server-side sanitization helpers for untrusted user input.
 * Keep this conservative: avoid HTML parsing; focus on bounds and control chars.
 */

export function sanitizePlainText(input: string, opts?: { maxLen?: number }): string {
  const maxLen = opts?.maxLen ?? 20_000
  return (
    input
      // normalize newlines
      .replace(/\r\n/g, '\n')
      // strip null bytes and other control chars except tab/newline
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, maxLen)
  )
}

