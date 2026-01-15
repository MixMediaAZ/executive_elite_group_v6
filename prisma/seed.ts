import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Optional: seed admin users from environment variables (no secrets committed)
  const admin1Email = process.env.ADMIN1_EMAIL?.trim().toLowerCase()
  const admin1Password = process.env.ADMIN1_PASSWORD
  const admin2Email = process.env.ADMIN2_EMAIL?.trim().toLowerCase()
  const admin2Password = process.env.ADMIN2_PASSWORD

  const adminInputs = [
    { email: admin1Email, password: admin1Password },
    { email: admin2Email, password: admin2Password },
  ].filter((a): a is { email: string; password: string } => Boolean(a.email && a.password))

  if (adminInputs.length > 0) {
    console.log(`Seeding ${adminInputs.length} admin user(s) from environment...`)
    for (const admin of adminInputs) {
      const passwordHash = await bcrypt.hash(admin.password, 10)
      // Case-insensitive upsert behavior (avoids duplicate admins by casing)
      const existing = await prisma.user.findFirst({
        where: {
          email: {
            equals: admin.email,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            email: admin.email, // normalize stored email going forward
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        })
      } else {
        await prisma.user.create({
          data: {
            email: admin.email,
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        })
      }
    }
  } else {
    console.log('No admin env vars found (ADMIN1_EMAIL/ADMIN1_PASSWORD, ADMIN2_EMAIL/ADMIN2_PASSWORD). Skipping admin seed.')
  }

  // Create default tiers
  const standardTier = await prisma.tier.upsert({
    where: { id: 'tier-standard' },
    update: {},
    create: {
      id: 'tier-standard',
      name: 'Standard 30-Day Posting',
      description: 'Standard job posting for 30 days',
      priceCents: 29900, // $299
      currency: 'usd',
      durationDays: 30,
      isFeatured: false,
      isPremium: false,
      active: true,
    },
  })

  const featuredTier = await prisma.tier.upsert({
    where: { id: 'tier-featured' },
    update: {},
    create: {
      id: 'tier-featured',
      name: 'Featured 30-Day Posting',
      description: 'Featured job posting with priority placement for 30 days',
      priceCents: 49900, // $499
      currency: 'usd',
      durationDays: 30,
      isFeatured: true,
      isPremium: false,
      active: true,
    },
  })

  const premiumTier = await prisma.tier.upsert({
    where: { id: 'tier-premium' },
    update: {},
    create: {
      id: 'tier-premium',
      name: 'Premium 60-Day Posting',
      description: 'Premium job posting with maximum visibility for 60 days',
      priceCents: 79900, // $799
      currency: 'usd',
      durationDays: 60,
      isFeatured: true,
      isPremium: true,
      active: true,
    },
  })

  console.log('Created tiers:', { standardTier, featuredTier, premiumTier })
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

