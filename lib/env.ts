/**
 * Minimal environment variable helpers.
 *
 * Keep these small and dependency-free so they can be used from API routes.
 */

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export function requireEnvPrefix(name: string, prefix: string): string {
  const value = requireEnv(name)
  if (!value.startsWith(prefix)) {
    throw new Error(`${name} must start with ${prefix}`)
  }
  return value
}

