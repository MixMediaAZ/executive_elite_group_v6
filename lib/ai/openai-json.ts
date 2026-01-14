import retry from 'async-retry'
import { logger } from '@/lib/monitoring/logger'
import OpenAI from 'openai'

export type OpenAiJsonOptions = {
  model: string
  system: string
  user: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  retries?: number
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let t: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    t = setTimeout(() => reject(new TimeoutError(`Timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (t) clearTimeout(t)
  }
}

function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Robustly extract JSON from an LLM response.
 * Handles:
 * - raw JSON
 * - ```json ... ```
 * - extra prose before/after JSON
 */
export function extractJsonObject<T>(raw: string): T {
  const direct = tryParseJson<T>(raw)
  if (direct) return direct

  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i) || raw.match(/```\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) {
    const parsed = tryParseJson<T>(fenced[1].trim())
    if (parsed) return parsed
  }

  // Best-effort: scan for the first top-level JSON object.
  const firstBrace = raw.indexOf('{')
  if (firstBrace >= 0) {
    let depth = 0
    for (let i = firstBrace; i < raw.length; i++) {
      const ch = raw[i]
      if (ch === '{') depth++
      if (ch === '}') depth--
      if (depth === 0) {
        const candidate = raw.slice(firstBrace, i + 1)
        const parsed = tryParseJson<T>(candidate)
        if (parsed) return parsed
        break
      }
    }
  }

  throw new Error('AI response was not valid JSON')
}

function isRetryableError(err: unknown): boolean {
  const anyErr = err as any
  const status = anyErr?.status || anyErr?.response?.status
  if (status === 429) return true
  if (typeof status === 'number' && status >= 500) return true
  // network-ish
  const msg = (anyErr?.message || '').toString().toLowerCase()
  return msg.includes('timeout') || msg.includes('econnreset') || msg.includes('fetch failed')
}

export async function openAiJson<T>(
  client: OpenAI,
  opts: OpenAiJsonOptions
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 30_000
  const retries = opts.retries ?? 2

  return retry(
    async (bail, attempt) => {
      const started = Date.now()
      try {
        const res = await withTimeout(
          client.chat.completions.create({
            model: opts.model,
            messages: [
              { role: 'system', content: opts.system },
              { role: 'user', content: opts.user },
            ],
            temperature: opts.temperature ?? 0.4,
            max_tokens: opts.maxTokens ?? 1200,
          }),
          timeoutMs
        )

        const content = res.choices?.[0]?.message?.content
        if (!content) throw new Error('No response content from OpenAI')

        const parsed = extractJsonObject<T>(content)
        logger.info(
          {
            aiModel: opts.model,
            aiAttempt: attempt,
            aiLatencyMs: Date.now() - started,
          },
          'AI JSON completion'
        )
        return parsed
      } catch (err) {
        // Bail (stop retrying) for non-retryable errors.
        if (!isRetryableError(err)) {
          bail(err as Error)
          // bail throws; return to satisfy TS control flow
          throw err
        }
        logger.warn(
          {
            aiModel: opts.model,
            aiAttempt: attempt,
            aiLatencyMs: Date.now() - started,
            err: err instanceof Error ? { message: err.message } : { message: String(err) },
          },
          'AI call failed'
        )
        throw err
      }
    },
    {
      retries,
      factor: 2,
      minTimeout: 500,
      maxTimeout: 5_000,
      randomize: true,
      onRetry: (err, attempt) => {
        logger.warn(
          {
            aiModel: opts.model,
            aiAttempt: attempt,
            retryable: isRetryableError(err),
            err: err instanceof Error ? { message: err.message } : { message: String(err) },
          },
          'Retrying AI call'
        )
      },
    }
  )
}

