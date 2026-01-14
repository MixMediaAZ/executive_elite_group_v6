const fs = require('fs')

const ENV_PATH = '.env'
const KEY = 'DATABASE_URL'

function readEnvFile(path) {
  return fs.readFileSync(path, 'utf8')
}

function writeEnvFile(path, contents) {
  fs.writeFileSync(path, contents)
}

function fixDatabaseUrl(rawValue) {
  let v = String(rawValue ?? '').trim()

  // Preserve quote style if present
  let quote = ''
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    quote = v[0]
    v = v.slice(1, -1)
  }

  // Repair common copy/paste mistakes seen in logs:
  // - missing '?' before query params (e.g. '/postgressslmode=...')
  // - stray trailing quote
  v = v.replace(/\/+$/, '')
  v = v.replace(/\"$/, '')
  v = v.replace(/\/postgressslmode=/, '/postgres?sslmode=')
  v = v.replace(/\/postgres(?=sslmode=|schema=)/, '/postgres?')

  let url
  try {
    url = new URL(v)
  } catch (e) {
    throw new Error(
      `Could not parse ${KEY} as a URL after repair. Please check your .env value. (${e?.message || e})`
    )
  }

  // Ensure DB name is correct (Supabase typically uses 'postgres')
  if (!url.pathname || url.pathname === '/' || url.pathname.startsWith('/postgressslmode')) {
    url.pathname = '/postgres'
  }

  // Force desired query parameters
  url.search = ''
  url.searchParams.set('schema', 'exec_elite')
  url.searchParams.set('sslmode', 'require')

  const fixed = url.toString()
  return quote ? `${quote}${fixed}${quote}` : fixed
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`Missing ${ENV_PATH}`)
    process.exit(1)
  }

  const contents = readEnvFile(ENV_PATH)
  const lines = contents.split(/\r?\n/)
  const idx = lines.findIndex((l) => new RegExp(`^\\s*${KEY}\\s*=`).test(l))

  if (idx < 0) {
    console.error(`${KEY} not found in ${ENV_PATH}`)
    process.exit(1)
  }

  const match = lines[idx].match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/)
  const currentValue = match ? match[1] : ''
  const nextValue = fixDatabaseUrl(currentValue)

  lines[idx] = `${KEY}=${nextValue}`
  writeEnvFile(ENV_PATH, lines.join('\r\n'))

  console.log(`Updated ${KEY} in ${ENV_PATH} (schema=exec_elite, sslmode=require).`)
}

main()

