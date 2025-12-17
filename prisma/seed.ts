import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

// Seed user credentials
const SEED_USER_EMAIL = "dev@gmail.com";
const SEED_USER_PASSWORD = "devdevdev";
const SEED_USER_FIRST_NAME = "Demo";
const SEED_USER_LAST_NAME = "User";

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

  // Create user with credentials
  console.log("👤 Creating seed user...");

  const normalizedEmail = SEED_USER_EMAIL.toLowerCase().trim();
  const displayName = `${SEED_USER_FIRST_NAME} ${SEED_USER_LAST_NAME}`;

  // Check if UserInfo exists (UserInfo is now the BetterAuth table)
  let userInfo = await prisma.userInfo.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  let appUser: { id: string } | null = userInfo?.user ?? null;

  if (!userInfo) {
    // Create UserInfo (BetterAuth user)
    userInfo = await prisma.userInfo.create({
      data: {
        email: normalizedEmail,
        emailVerified: true, // Skip email verification for seed user
        firstName: SEED_USER_FIRST_NAME,
        lastName: SEED_USER_LAST_NAME,
        name: displayName,
      },
      include: { user: true },
    });

    // Create the app User record linked to UserInfo
    appUser = await prisma.user.create({
      data: {
        userInfoId: userInfo.id,
      },
    });

    // Hash password and create account (Account references UserInfo.id)
    const hashedPassword = await hashPassword(SEED_USER_PASSWORD);

    await prisma.account.create({
      data: {
        userId: userInfo.id, // This is now the UserInfo ID
        accountId: userInfo.id, // For credential accounts, accountId = userId
        providerId: "credential", // BetterAuth uses "credential" for email/password
        password: hashedPassword,
      },
    });

    console.log("✅ User created");
  } else {
    console.log("✅ User already exists");

    // Ensure app User exists
    if (!userInfo.user) {
      appUser = await prisma.user.create({
        data: {
          userInfoId: userInfo.id,
        },
      });
      console.log("✅ App User created");
    }
  }

  // At this point, appUser is guaranteed to exist
  if (!appUser) {
    throw new Error("Failed to create or find app user");
  }

  // Create tags for the user (tags reference the app User)
  console.log(`\n📋 Creating ${defaultTags.length} default tags...`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const tag of defaultTags) {
    try {
      await prisma.tag.create({
        data: {
          userId: appUser.id, // This is the app User ID
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
