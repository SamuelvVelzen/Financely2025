import { randomBytes } from "node:crypto";
import {
  PrismaClient,
  TransactionType,
  type Prisma,
} from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { checkSeedEnvironment } from "./seed-guard";
import { resolveSeedIdentity } from "./seed-helpers";

const prisma = new PrismaClient();

const WORKSPACE_PERSONAL = "Personal";
const WORKSPACE_BUSINESS_DEMO = "Business demo";
const SAMPLE_SPLIT_GROUP_NAME = "Sample trip";
const SEED_EXTERNAL_ID_PREFIX = "seed:";

export const defaultTags = [
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
] as const;

function assertSeedEnvironmentAllowed(): void {
  const result = checkSeedEnvironment(process.env);
  if (result.warning) {
    console.warn(`⚠️  ${result.warning}`);
  }
  if (!result.allowed) {
    console.error(`❌ ${result.errorMessage}`);
    process.exit(1);
  }
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function generateGuestToken(): string {
  return randomBytes(24).toString("base64url");
}

async function ensureWorkspacesForUser(
  userId: string,
  options: { includeBusinessDemo: boolean },
) {
  let personal = await prisma.workspace.findFirst({
    where: { userId, name: WORKSPACE_PERSONAL },
  });
  if (!personal) {
    personal = await prisma.workspace.create({
      data: { userId, name: WORKSPACE_PERSONAL },
    });
  }

  if (options.includeBusinessDemo) {
    const business = await prisma.workspace.findFirst({
      where: { userId, name: WORKSPACE_BUSINESS_DEMO },
    });
    if (!business) {
      await prisma.workspace.create({
        data: { userId, name: WORKSPACE_BUSINESS_DEMO },
      });
    }
  }

  return { personalId: personal.id };
}

async function ensureDefaultTags(userId: string, workspaceId: number) {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const tag of defaultTags) {
    try {
      const existingTag = await prisma.tag.findUnique({
        where: {
          workspaceId_name: {
            workspaceId,
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
        updatedCount++;
      } else {
        await prisma.tag.create({
          data: {
            userId,
            workspaceId,
            name: tag.name,
            color: tag.color,
            description: tag.description,
            emoticon: tag.emoticon ?? null,
            order: tag.order,
            transactionType: tag.transactionType,
          },
        });
        createdCount++;
      }
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "P2002") {
        skippedCount++;
      } else {
        throw error;
      }
    }
  }

  return { createdCount, updatedCount, skippedCount };
}

async function ensureSampleTransactions(
  userId: string,
  workspaceId: number,
): Promise<number> {
  const tags = await prisma.tag.findMany({
    where: { workspaceId },
  });
  const byName = new Map(tags.map((tag) => [tag.name, tag]));

  const samples: Array<{
    externalId: string;
    type: TransactionType;
    amount: string;
    name: string;
    description: string;
    paymentMethod: string;
    daysAgo: number;
    tagName: string;
  }> = [
    {
      externalId: `${SEED_EXTERNAL_ID_PREFIX}salary`,
      type: TransactionType.INCOME,
      amount: "3200.00",
      name: "Salary",
      description: "Monthly salary (sample)",
      paymentMethod: "bank_transfer",
      daysAgo: 5,
      tagName: "Income",
    },
    {
      externalId: `${SEED_EXTERNAL_ID_PREFIX}groceries`,
      type: TransactionType.EXPENSE,
      amount: "54.20",
      name: "Groceries",
      description: "Weekly groceries (sample)",
      paymentMethod: "debit_card",
      daysAgo: 2,
      tagName: "Food & Dining",
    },
    {
      externalId: `${SEED_EXTERNAL_ID_PREFIX}transit`,
      type: TransactionType.EXPENSE,
      amount: "12.50",
      name: "Transit pass",
      description: "Public transit (sample)",
      paymentMethod: "debit_card",
      daysAgo: 1,
      tagName: "Transportation",
    },
  ];

  let created = 0;
  for (const sample of samples) {
    const existing = await prisma.transaction.findFirst({
      where: {
        userId,
        workspaceId,
        externalId: sample.externalId,
      },
    });
    if (existing) continue;

    const tag = byName.get(sample.tagName);
    const data: Prisma.TransactionCreateInput = {
      user: { connect: { id: userId } },
      workspace: { connect: { id: workspaceId } },
      type: sample.type,
      amount: sample.amount,
      currency: "EUR",
      transactionDate: daysAgo(sample.daysAgo),
      name: sample.name,
      description: sample.description,
      externalId: sample.externalId,
      paymentMethod: sample.paymentMethod,
      ...(tag
        ? {
            primaryTag: { connect: { id: tag.id } },
            tags: { connect: [{ id: tag.id }] },
          }
        : {}),
    };

    await prisma.transaction.create({ data });
    created++;
  }

  return created;
}

async function ensureSampleSplitGroup(
  userId: string,
  displayName: string,
  email: string,
): Promise<boolean> {
  const existing = await prisma.splitGroup.findFirst({
    where: {
      createdByUserId: userId,
      name: SAMPLE_SPLIT_GROUP_NAME,
    },
  });
  if (existing) return false;

  const normalizedEmail = email.toLowerCase().trim();

  await prisma.$transaction(async (tx) => {
    const group = await tx.splitGroup.create({
      data: {
        name: SAMPLE_SPLIT_GROUP_NAME,
        defaultCurrency: "EUR",
        createdByUserId: userId,
        guestAccessToken: generateGuestToken(),
        guestCanSettle: true,
      },
    });

    const adminMember = await tx.splitGroupMember.create({
      data: {
        groupId: group.id,
        userId,
        displayName,
        email: normalizedEmail,
        normalizedEmail,
        status: "linked",
        role: "admin",
      },
    });

    const guestMember = await tx.splitGroupMember.create({
      data: {
        groupId: group.id,
        displayName: "Guest Friend",
        email: "guest.friend@example.com",
        normalizedEmail: "guest.friend@example.com",
        status: "guest",
        role: "member",
      },
    });

    const expense = await tx.splitExpense.create({
      data: {
        groupId: group.id,
        paidByMemberId: adminMember.id,
        amount: "48.00",
        currency: "EUR",
        groupAmount: "48.00",
        conversionStatus: "ready",
        description: "Dinner",
        expenseDate: daysAgo(3),
        splitMode: "equal",
        createdByUserId: userId,
      },
    });

    await tx.splitExpenseShare.createMany({
      data: [
        {
          expenseId: expense.id,
          memberId: adminMember.id,
          shareAmount: "24.00",
          shareGroupAmount: "24.00",
          status: "active",
        },
        {
          expenseId: expense.id,
          memberId: guestMember.id,
          shareAmount: "24.00",
          shareGroupAmount: "24.00",
          status: "active",
        },
      ],
    });
  });

  return true;
}

async function main() {
  assertSeedEnvironmentAllowed();

  const identity = resolveSeedIdentity(process.env);
  const {
    email: seedEmail,
    password: seedPassword,
    firstName,
    lastName,
    isProduction,
  } = identity;

  console.log("🌱 Starting seed...");
  console.log(
    isProduction
      ? "📦 Production bootstrap mode"
      : "🧪 Development seed mode",
  );

  const normalizedEmail = seedEmail.toLowerCase().trim();
  const displayName = `${firstName} ${lastName}`;

  let userInfo = await prisma.userInfo.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  let appUser: { id: string } | null = userInfo?.user ?? null;
  const workspaceNames = isProduction
    ? [{ name: WORKSPACE_PERSONAL }]
    : [{ name: WORKSPACE_PERSONAL }, { name: WORKSPACE_BUSINESS_DEMO }];

  if (!userInfo) {
    userInfo = await prisma.userInfo.create({
      data: {
        email: normalizedEmail,
        emailVerified: true,
        firstName,
        lastName,
        name: displayName,
      },
      include: { user: true },
    });

    appUser = await prisma.user.create({
      data: {
        userInfoId: userInfo.id,
        workspaces: {
          create: workspaceNames,
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
            create: workspaceNames,
          },
        },
      });
      console.log("✅ App User created with workspaces");
    }
  }

  if (!appUser) {
    throw new Error("Failed to create or find app user");
  }

  const { personalId } = await ensureWorkspacesForUser(appUser.id, {
    includeBusinessDemo: !isProduction,
  });

  console.log(
    `\n📋 Creating/updating ${defaultTags.length} default tags in "${WORKSPACE_PERSONAL}"...`,
  );
  const tagStats = await ensureDefaultTags(appUser.id, personalId);
  console.log(`   Created: ${tagStats.createdCount} tags`);
  console.log(`   Updated: ${tagStats.updatedCount} tags`);
  console.log(`   Skipped: ${tagStats.skippedCount} tags`);

  if (isProduction) {
    const txCreated = await ensureSampleTransactions(appUser.id, personalId);
    const splitCreated = await ensureSampleSplitGroup(
      appUser.id,
      displayName,
      normalizedEmail,
    );
    console.log(`\n🧾 Sample transactions created: ${txCreated}`);
    console.log(
      `👥 Sample split group: ${splitCreated ? "created" : "already present"}`,
    );
  }

  console.log(`\n🎉 Seed completed!`);
  if (!isProduction) {
    console.log(`\n📧 Seed user (development only):`);
    console.log(`   Email: ${normalizedEmail}`);
    console.log(`   Password: ${seedPassword}`);
    console.log(`   (Use these credentials to log in locally)`);
  } else {
    console.log(`\n📧 Seed user created: ${normalizedEmail}`);
    console.log(
      "   Unset SEED_ALLOW_IN_PRODUCTION after this one-shot bootstrap.",
    );
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
