import { prisma } from "@/features/util/prisma";
import { TransactionType } from "@prisma/client";

const TEST_EMAIL_DOMAIN = "@test.financely.local";

export async function cleanupTestUsers(): Promise<void> {
  await prisma.userInfo.deleteMany({
    where: {
      email: { endsWith: TEST_EMAIL_DOMAIN },
    },
  });
}

export async function createTestUser(label: string) {
  const email = `${label}${TEST_EMAIL_DOMAIN}`;

  const userInfo = await prisma.userInfo.create({
    data: {
      email,
      emailVerified: true,
      firstName: "Test",
      lastName: label,
      name: `Test ${label}`,
    },
  });

  const user = await prisma.user.create({
    data: {
      userInfoId: userInfo.id,
      workspaces: {
        create: [{ name: "Personal" }],
      },
    },
    include: { workspaces: true },
  });

  const workspace = user.workspaces[0];
  if (!workspace) {
    throw new Error("Expected test user to have a workspace");
  }

  return { userInfo, user, workspace };
}

export async function createTestTransaction(
  userId: string,
  workspaceId: number,
  name = "Test transaction",
) {
  return prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      type: TransactionType.EXPENSE,
      amount: 42.5,
      currency: "EUR",
      transactionDate: new Date("2025-01-15T12:00:00.000Z"),
      name,
      paymentMethod: "CREDIT_CARD",
    },
  });
}
