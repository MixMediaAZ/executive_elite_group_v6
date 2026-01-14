/**
 * Simple database connection test script
 * Run with: node scripts/test-db-connection.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  console.log('🔍 Testing database connection...\n')
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL is not set in .env file')
    console.log('\n📝 Please create a .env file with:')
    console.log('DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@HOST:PORT/database?sslmode=require"')
    process.exit(1)
  }

  // Mask password in output
  const maskedUrl = process.env.DATABASE_URL.replace(/:(.*)@/, ':****@')
  console.log(`📡 Connection string: ${maskedUrl}\n`)

  const prisma = new PrismaClient({
    log: ['error'],
  })

  try {
    console.log('⏳ Connecting to database...')
    
    // Simple connection test
    await prisma.$connect()
    console.log('✅ Database connection successful!\n')

    // Test a simple query
    console.log('⏳ Testing query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query test successful!\n')

    console.log('🎉 Database is ready to use!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run db:setup')
    console.log('   (This will generate Prisma client, create all tables, and seed default data)')
    console.log('\nOr manually:')
    console.log('1. Run: npx prisma generate')
    console.log('2. Run: npx prisma db push')
    console.log('3. Run: npm run prisma:seed')
    
  } catch (error) {
    console.error('\n❌ Database connection failed!\n')
    const errorMessage = error.message || String(error)
    console.error('Error details:', errorMessage)
    
    if (errorMessage.includes('Tenant or user not found')) {
      console.log('\n💡 "Tenant or user not found" - This means authentication failed:')
      console.log('1. Check your DATABASE_URL username is correct')
      console.log('   - For Supabase: Should be "postgres.xxxxx" (with project ID)')
      console.log('   - Format: postgresql://postgres.xxxxx:PASSWORD@host:port/database')
      console.log('2. Verify your database password is correct')
      console.log('   - This is the password you set when creating the Supabase project')
      console.log('   - NOT your Supabase account password')
      console.log('3. URL-encode special characters in password (!, @, #, $, %, &, =)')
      console.log('   - Example: "MyPass!123" becomes "MyPass%21123"')
      console.log('4. Make sure the connection string format is correct')
      console.log('   - Get it from: Supabase Dashboard → Settings → Database → Connection string')
      console.log('   - Select "Session mode" for best compatibility')
    } else if (errorMessage.includes("Can't reach database server")) {
      console.log('\n💡 Cannot reach database server - check:')
      console.log('1. Check your Supabase project is not paused')
      console.log('2. Verify your password is correct')
      console.log('3. Try using Session Pooler connection string (pooler.supabase.com)')
      console.log('4. Make sure you added ?sslmode=require to the connection string')
      console.log('5. Check your internet connection and firewall settings')
    } else if (errorMessage.includes('P1001')) {
      console.log('\n💡 Connection timeout - check:')
      console.log('1. Your internet connection')
      console.log('2. Supabase project status (not paused)')
      console.log('3. Firewall settings')
      console.log('4. Try using Session Pooler connection string')
    } else if (errorMessage.includes('authentication') || errorMessage.includes('password')) {
      console.log('\n💡 Authentication failed - check:')
      console.log('1. Database password is correct (project password, not account password)')
      console.log('2. Username format is correct (postgres.xxxxx for Supabase)')
      console.log('3. Special characters in password are URL-encoded')
      console.log('4. Connection string format is correct')
    } else if (errorMessage.includes('schema')) {
      console.log('\n💡 Schema error - check:')
      console.log('1. If using exec_elite schema, ensure tables exist there')
      console.log('2. If using public schema, remove ?schema=exec_elite from DATABASE_URL')
      console.log('3. Run: npm run db:setup to create tables in the correct schema')
    }
    
    console.log('\n📝 Example correct DATABASE_URL format:')
    console.log('DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require"')
    console.log('\n   Or with exec_elite schema:')
    console.log('DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?schema=exec_elite&sslmode=require"')
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

