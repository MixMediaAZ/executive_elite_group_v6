import { GET } from '@/app/api/health/route'
import { GET as GET_DETAILED } from '@/app/api/health/detailed/route'

describe('/api/health', () => {
  test('returns 500 when required env vars are missing', async () => {
    // Ensure required env vars are not set for this test
    delete process.env.DATABASE_URL
    delete process.env.NEXTAUTH_SECRET
    delete process.env.NEXTAUTH_URL

    const res = await GET()
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks).toBeDefined()
    expect(body.checks.databaseUrl).toBe(false)
  })
})

describe('/api/health/detailed', () => {
  test('returns 503 when required env vars are missing', async () => {
    delete process.env.DATABASE_URL
    delete process.env.NEXTAUTH_SECRET
    delete process.env.NEXTAUTH_URL

    const res = await GET_DETAILED()
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.status).toBeDefined()
    expect(body.checks?.env?.DATABASE_URL).toBe(false)
  })
})
