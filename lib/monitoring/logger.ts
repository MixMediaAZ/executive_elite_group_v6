import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID)

/**
 * Central structured logger.
 *
 * In production, log JSON for ingestion. In dev, pretty print.
 * Do NOT log secrets (tokens, passwords, API keys).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : isProd ? 'info' : 'debug'),
  ...(isProd || isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
  base: {
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'password',
      'passwordHash',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      'OPENAI_API_KEY',
      'NEXTAUTH_SECRET',
      'STRIPE_SECRET_KEY',
    ],
    remove: true,
  },
})

