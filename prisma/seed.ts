import { PrismaClient, TransactionType } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

const SEED_USER_EMAIL = "dev@gmail.com";
const SEED_USER_PASSWORD = "devdevdev";
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
  console.log("🌱 Starting seed...");

  console.log("👤 Creating seed user...");

  const normalizedEmail = SEED_USER_EMAIL.toLowerCase().trim();
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

    const hashedPassword = await hashPassword(SEED_USER_PASSWORD);

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
