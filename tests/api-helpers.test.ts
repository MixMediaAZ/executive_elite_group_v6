import { z } from 'zod'
import { errorResponse, successResponse, validateBody } from '@/lib/api-core'

describe('lib/api-helpers', () => {
  test('validateBody returns parsed values', () => {
    const schema = z.object({
      email: z.string().email(),
    })

    const parsed = validateBody(schema, { email: 'a@b.com' })
    expect(parsed).toEqual({ email: 'a@b.com' })
  })

  test('validateBody throws on invalid input', () => {
    const schema = z.object({
      email: z.string().email(),
    })

    expect(() => validateBody(schema, { email: 'not-an-email' })).toThrow()
  })

  test('successResponse returns success=true with data', async () => {
    const res = successResponse({ ok: 1 }, 'hello')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ success: true, data: { ok: 1 }, message: 'hello' })
  })

  test('errorResponse returns consistent envelope', async () => {
    const res = errorResponse('bad', 418, { why: 'teapot' })
    expect(res.status).toBe(418)
    const json = await res.json()
    expect(json.error).toBe('bad')
    expect(json.details).toEqual({ why: 'teapot' })
    expect(typeof json.timestamp).toBe('string')
  })
})

