/**
 * Create Admin User Script
 * Run with: tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@executiveelite.com'
  const password = 'Admin123!'
  
  console.log('🔐 Creating admin user...')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log('')

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!')
      console.log('   Updating password...')
      
      const passwordHash = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      
      console.log('✅ Admin password updated!')
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(password, 10)
      
      const admin = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })
      
      console.log('✅ Admin user created!')
      console.log(`   User ID: ${admin.id}`)
    }
    
    console.log('')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('')
    console.log('🚀 You can now log in at: http://localhost:3000/auth/login')
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

