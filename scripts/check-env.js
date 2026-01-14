#!/usr/bin/env node

/**
 * Environment Validation Script
 * Run this to check if all required environment variables are set
 */

const requiredEnvVars = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
]

const optionalEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'MAILERSEND_API_KEY'
]

console.log('🔍 Checking Environment Variables...\n')

let hasErrors = false

// Check required variables
console.log('📋 Required Variables:')
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  if (value) {
    const displayValue = envVar.includes('KEY') || envVar.includes('SECRET') 
      ? `${value.substring(0, 8)}...` 
      : value
    console.log(`✅ ${envVar}: ${displayValue}`)
  } else {
    console.log(`❌ ${envVar}: NOT SET`)
    hasErrors = true
  }
})

console.log('\n📋 Optional Variables:')
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  if (value) {
    const displayValue = envVar.includes('KEY') || envVar.includes('SECRET')
      ? `${value.substring(0, 8)}...`
      : value
    console.log(`✅ ${envVar}: ${displayValue}`)
  } else {
    console.log(`⚪️ ${envVar}: Not set (optional)`)
  }
})

// Check AI-specific validations
console.log('\n🤖 AI Configuration:')
if (process.env.OPENAI_API_KEY) {
  if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('✅ OpenAI API Key format looks correct')
  } else {
    console.log('⚠️ OpenAI API Key format might be incorrect (should start with "sk-")')
  }
} else {
  console.log('❌ OpenAI API Key not set - AI features will not work')
  hasErrors = true
}

// Database connection test
console.log('\n💾 Database Configuration:')
if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes('supabase.com')) {
    console.log('✅ Supabase database URL detected')
  } else if (process.env.DATABASE_URL.includes('localhost')) {
    console.log('✅ Local SQLite database detected')
  } else {
    console.log('⚠️ Unknown database configuration')
  }
} else {
  console.log('❌ Database URL not set')
  hasErrors = true
}

console.log('\n' + '='.repeat(50))
if (hasErrors) {
  console.log('❌ Deployment Ready: NO - Please fix the missing required variables')
  process.exit(1)
} else {
  console.log('✅ Deployment Ready: YES - All required variables are set')
  process.exit(0)
}
