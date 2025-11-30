import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

// Seed user credentials
const SEED_USER_EMAIL = "dev@gmail.com";
const SEED_USER_PASSWORD = "dev";
const SEED_USER_NAME = "Dev User";

/**
 * Default tags for financial management
 */
const defaultTags = [
  {
    name: "Food & Dining",
    color: "#FF6B6B",
    description: "Restaurants, groceries, and food-related expenses",
    order: 0,
  },
  {
    name: "Transportation",
    color: "#4ECDC4",
    description: "Gas, public transit, car maintenance, and travel",
    order: 1,
  },
  {
    name: "Shopping",
    color: "#9B59B6",
    description: "General shopping and retail purchases",
    order: 2,
  },
  {
    name: "Entertainment",
    color: "#E91E63",
    description: "Movies, concerts, hobbies, and leisure activities",
    order: 3,
  },
  {
    name: "Bills & Utilities",
    color: "#F39C12",
    description: "Electricity, water, internet, phone, and other bills",
    order: 4,
  },
  {
    name: "Healthcare",
    color: "#2ECC71",
    description: "Medical expenses, prescriptions, and health services",
    order: 5,
  },
  {
    name: "Income",
    color: "#27AE60",
    description: "Salary, freelance income, and other earnings",
    order: 6,
  },
  {
    name: "Savings",
    color: "#3498DB",
    description: "Savings transfers and investment contributions",
    order: 7,
  },
  {
    name: "Other",
    color: "#95A5A6",
    description: "Miscellaneous expenses that don't fit other categories",
    order: 8,
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Create BetterAuth user with credentials
  console.log("👤 Creating seed user with BetterAuth...");

  let betterAuthUser = await prisma.betterAuthUser.findUnique({
    where: { email: SEED_USER_EMAIL },
  });

  if (!betterAuthUser) {
    // Create BetterAuth user
    betterAuthUser = await prisma.betterAuthUser.create({
      data: {
        email: SEED_USER_EMAIL,
        name: SEED_USER_NAME,
        emailVerified: true, // Skip email verification for seed user
      },
    });

    // Hash password and create account
    const hashedPassword = await hashPassword(SEED_USER_PASSWORD);

    await prisma.betterAuthAccount.create({
      data: {
        userId: betterAuthUser.id,
        accountId: betterAuthUser.id, // For credential accounts, accountId = userId
        providerId: "credential", // BetterAuth uses "credential" for email/password
        password: hashedPassword,
      },
    });

    console.log("✅ BetterAuth user created");
  } else {
    console.log("✅ BetterAuth user already exists");
  }

  // Sync to app User table
  const normalizedEmail = SEED_USER_EMAIL.toLowerCase().trim();
  let appUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { betterAuthUserId: betterAuthUser.id }],
    },
    include: { userInfo: true },
  });

  if (!appUser) {
    console.log("📝 Creating app User record...");
    appUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        primaryEmail: normalizedEmail,
        isEmailVerified: true,
        betterAuthUserId: betterAuthUser.id,
        status: "ACTIVE",
        userInfo: {
          create: {
            firstName: "Demo",
            lastName: "User",
          },
        },
      },
      include: { userInfo: true },
    });
    console.log("✅ App User created");
  } else {
    console.log("✅ App User already exists");
    // Update betterAuthUserId if missing
    if (!appUser.betterAuthUserId) {
      await prisma.user.update({
        where: { id: appUser.id },
        data: { betterAuthUserId: betterAuthUser.id },
      });
      console.log("✅ Linked app User to BetterAuth user");
    }
    // Ensure UserInfo exists
    if (!appUser.userInfo) {
      await prisma.userInfo.create({
        data: {
          userId: appUser.id,
          firstName: "Demo",
          lastName: "User",
        },
      });
      console.log("✅ UserInfo created");
    }
  }

  const user = appUser;

  // Create tags for the user
  console.log(`\n📋 Creating ${defaultTags.length} default tags...`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const tag of defaultTags) {
    try {
      await prisma.tag.create({
        data: {
          userId: user.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          order: tag.order,
        },
      });
      console.log(`  ✅ Created tag: ${tag.name}`);
      createdCount++;
    } catch (error: any) {
      // Handle unique constraint violation (tag already exists)
      if (error.code === "P2002") {
        console.log(`  ⏭️  Tag already exists: ${tag.name}`);
        skippedCount++;
      } else {
        console.error(`  ❌ Error creating tag ${tag.name}:`, error);
        throw error;
      }
    }
  }

  console.log(`\n🎉 Seed completed!`);
  console.log(`   Created: ${createdCount} tags`);
  console.log(`   Skipped: ${skippedCount} tags (already exist)`);
  console.log(`\n📧 Seed User Credentials:`);
  console.log(`   Email: ${SEED_USER_EMAIL}`);
  console.log(`   Password: ${SEED_USER_PASSWORD}`);
  console.log(`   (Use these credentials to log in)`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
