import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CANDIDATE', 'EMPLOYER']),
})

type PrismaLikeError = {
  code?: string
  message?: string
}

function isDatabaseConnectionError(error: PrismaLikeError | undefined) {
  if (!error) return false
  return (
    error.code === 'P1001' ||
    (typeof error.message === 'string' && error.message.includes("Can't reach database server"))
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    const emailInput = validated.email.trim()
    const normalizedEmail = emailInput.toLowerCase()

    // Case-insensitive check to prevent duplicate accounts by casing
    const existingUser = await db.user.findFirst({
      where: {
        email: {
          equals: emailInput,
          mode: 'insensitive',
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(validated.password, 10)

    // Use a transaction to ensure both user and profile are created together
    const result = await db.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: validated.role,
        },
      })

      // Create profile based on role
      if (validated.role === 'CANDIDATE') {
        await tx.candidateProfile.create({
          data: {
            userId: user.id,
            fullName: '', // Will be filled in onboarding
          },
        })
      } else if (validated.role === 'EMPLOYER') {
        await tx.employerProfile.create({
          data: {
            userId: user.id,
            orgName: '', // Will be filled in onboarding
            orgType: 'OTHER',
          },
        })
      }

      return user
    })

    return NextResponse.json({ success: true, userId: result.id })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    
    // Check if it's a database connection error
    if (isDatabaseConnectionError(error as PrismaLikeError)) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your DATABASE_URL in .env file. See DATABASE_SETUP.md for help.' },
        { status: 500 }
      )
    }

    // Check for Prisma unique constraint errors (duplicate email)
    const prismaError = error as PrismaLikeError
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Provide more detailed error message
    const errorMessage = prismaError.message || 'Registration failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

