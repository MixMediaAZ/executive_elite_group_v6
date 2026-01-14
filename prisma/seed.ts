import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

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

