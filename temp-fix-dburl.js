const fs = require('fs')
const envPath = '.env'
let content = fs.readFileSync(envPath, 'utf8')
const fixed = content.replace(/DATABASE_URL=.*/, 'DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?schema=exec_elite&sslmode=require"')
fs.writeFileSync(envPath, fixed)
console.log('Updated DATABASE_URL in .env')