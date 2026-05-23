import { PrismaClient, TransactionType } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

/** Known weak credentials — must never be created in production. */
const SEED_USER_EMAIL = "dev@gmail.com";
const SEED_USER_PASSWORD = "devdevdev";

/**
 * Refuse to seed when NODE_ENV is production.
 * Optional escape hatch for controlled environments: SEED_ALLOW_IN_PRODUCTION=true
 * plus non-default SEED_USER_PASSWORD (min 12 chars).
 */
function assertSeedEnvironmentAllowed(): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    return;
  }

  const allowOverride = process.env.SEED_ALLOW_IN_PRODUCTION === "true";
  const passwordOverride = process.env.SEED_USER_PASSWORD?.trim();
  const emailOverride = process.env.SEED_USER_EMAIL?.trim();

  const hasSafeOverrides =
    allowOverride &&
    emailOverride &&
    emailOverride !== SEED_USER_EMAIL &&
    passwordOverride &&
    passwordOverride !== SEED_USER_PASSWORD &&
    passwordOverride.length >= 12;

  if (hasSafeOverrides) {
    console.warn(
      "⚠️  Running seed in production with SEED_ALLOW_IN_PRODUCTION and custom credentials."
    );
    return;
  }

  console.error(
    "❌ Refusing to run seed in production.\n" +
      "   This script creates a demo user with well-known credentials (dev@gmail.com / devdevdev).\n" +
      "   For local development, run: yarn seed (with NODE_ENV unset or development).\n" +
      "   To seed a non-local environment intentionally, set SEED_ALLOW_IN_PRODUCTION=true,\n" +
      "   SEED_USER_EMAIL, and SEED_USER_PASSWORD (12+ chars, not the defaults)."
  );
  process.exit(1);
}

function resolveSeedCredentials(): { email: string; password: string } {
  return {
    email: (process.env.SEED_USER_EMAIL?.trim() || SEED_USER_EMAIL).toLowerCase(),
    password: process.env.SEED_USER_PASSWORD?.trim() || SEED_USER_PASSWORD,
  };
}
const SEED_USER_FIRST_NAME = "Demo";
const SEED_USER_LAST_NAME = "User";

const WORKSPACE_PERSONAL = "Personal";
const WORKSPACE_BUSINESS_DEMO = "Business demo";

const defaultTags = [
  {
    name: "Food & Dining",
    color: "#FF6B6B",
    description: "Restaurants, groceries, and food-related expenses",
    emoticon: "🍔",
    order: 0,
    transactionType: TransactionType.EXPENSE,
  },
  {
    name: "Transportation",
    color: "#4ECDC4",
    description: "Gas, public transit, car maintenance, and travel",
    emoticon: "🚗",
    order: 1,
    transactionType: TransactionType.EXPENSE,
  },
  {
    name: "Shopping",
    color: "#9B59B6",
    description: "General shopping and retail purchases",
    emoticon: "🛍️",
    order: 2,
    transactionType: TransactionType.EXPENSE,
  },
  {
    name: "Entertainment",
    color: "#E91E63",
    description: "Movies, concerts, hobbies, and leisure activities",
    emoticon: "🎬",
    order: 3,
    transactionType: TransactionType.EXPENSE,
  },
  {
    name: "Bills & Utilities",
    color: "#F39C12",
    description: "Electricity, water, internet, phone, and other bills",
    emoticon: "💡",
    order: 4,
    transactionType: TransactionType.EXPENSE,
  },
  {
    name: "Healthcare",
    color: "#2ECC71",
    description: "Medical expenses, prescriptions, and health services",
    emoticon: "🏥",
    order: 5,
    transactionType: TransactionType.EXPENSE,
  },
  {
    name: "Income",
    color: "#27AE60",
    description: "Salary, freelance income, and other earnings",
    emoticon: "💰",
    order: 6,
    transactionType: TransactionType.INCOME,
  },
  {
    name: "Savings",
    color: "#3498DB",
    description: "Savings transfers and investment contributions",
    emoticon: "💾",
    order: 7,
    transactionType: TransactionType.EXPENSE,
  },
  {
    name: "Other",
    color: "#95A5A6",
    description: "Miscellaneous expenses that don't fit other categories",
    emoticon: "📦",
    order: 8,
    transactionType: TransactionType.EXPENSE,
  },
];

async function ensureWorkspacesForUser(userId: string) {
  let personal = await prisma.workspace.findFirst({
    where: { userId, name: WORKSPACE_PERSONAL },
  });
  if (!personal) {
    personal = await prisma.workspace.create({
      data: { userId, name: WORKSPACE_PERSONAL },
    });
  }
  let business = await prisma.workspace.findFirst({
    where: { userId, name: WORKSPACE_BUSINESS_DEMO },
  });
  if (!business) {
    business = await prisma.workspace.create({
      data: { userId, name: WORKSPACE_BUSINESS_DEMO },
    });
  }
  return { personalId: personal.id, businessId: business.id };
}

async function main() {
  assertSeedEnvironmentAllowed();

  const { email: seedEmail, password: seedPassword } = resolveSeedCredentials();

  console.log("🌱 Starting seed...");

  console.log("👤 Creating seed user...");

  const normalizedEmail = seedEmail.toLowerCase().trim();
  const displayName = `${SEED_USER_FIRST_NAME} ${SEED_USER_LAST_NAME}`;

  let userInfo = await prisma.userInfo.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  let appUser: { id: string } | null = userInfo?.user ?? null;

  if (!userInfo) {
    userInfo = await prisma.userInfo.create({
      data: {
        email: normalizedEmail,
        emailVerified: true,
        firstName: SEED_USER_FIRST_NAME,
        lastName: SEED_USER_LAST_NAME,
        name: displayName,
      },
      include: { user: true },
    });

    appUser = await prisma.user.create({
      data: {
        userInfoId: userInfo.id,
        workspaces: {
          create: [
            { name: WORKSPACE_PERSONAL },
            { name: WORKSPACE_BUSINESS_DEMO },
          ],
        },
      },
    });

    const hashedPassword = await hashPassword(seedPassword);

    await prisma.account.create({
      data: {
        userId: userInfo.id,
        accountId: userInfo.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    console.log("✅ User created with workspaces");
  } else {
    console.log("✅ User already exists");

    if (!userInfo.user) {
      appUser = await prisma.user.create({
        data: {
          userInfoId: userInfo.id,
          workspaces: {
            create: [
              { name: WORKSPACE_PERSONAL },
              { name: WORKSPACE_BUSINESS_DEMO },
            ],
          },
        },
      });
      console.log("✅ App User created with workspaces");
    }
  }

  if (!appUser) {
    throw new Error("Failed to create or find app user");
  }

  const { personalId } = await ensureWorkspacesForUser(appUser.id);

  console.log(`\n📋 Creating/updating ${defaultTags.length} default tags in "${WORKSPACE_PERSONAL}"...`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const tag of defaultTags) {
    try {
      const existingTag = await prisma.tag.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: personalId,
            name: tag.name,
          },
        },
      });

      if (existingTag) {
        await prisma.tag.update({
          where: { id: existingTag.id },
          data: {
            transactionType: tag.transactionType,
            emoticon: tag.emoticon ?? null,
          },
        });
        console.log(`  🔄 Updated tag: ${tag.name}`);
        updatedCount++;
      } else {
        await prisma.tag.create({
          data: {
            userId: appUser.id,
            workspaceId: personalId,
            name: tag.name,
            color: tag.color,
            description: tag.description,
            emoticon: tag.emoticon ?? null,
            order: tag.order,
            transactionType: tag.transactionType,
          },
        });
        console.log(`  ✅ Created tag: ${tag.name}`);
        createdCount++;
      }
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "P2002") {
        console.log(`  ⏭️  Tag already exists: ${tag.name}`);
        skippedCount++;
      } else {
        console.error(`  ❌ Error processing tag ${tag.name}:`, error);
        throw error;
      }
    }
  }

  console.log(`\n🎉 Seed completed!`);
  console.log(`   Created: ${createdCount} tags`);
  console.log(`   Updated: ${updatedCount} tags`);
  console.log(`   Skipped: ${skippedCount} tags`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 Seed user (development only):`);
    console.log(`   Email: ${normalizedEmail}`);
    console.log(`   Password: ${seedPassword}`);
    console.log(`   (Use these credentials to log in locally)`);
  } else {
    console.log(`\n📧 Seed user created: ${normalizedEmail}`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
