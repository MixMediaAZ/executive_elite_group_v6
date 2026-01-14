// Re-export GET and POST handlers from auth.ts (NextAuth v5 beta pattern)
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
