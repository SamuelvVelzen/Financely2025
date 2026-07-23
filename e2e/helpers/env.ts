import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  E2E_DATABASE_URL,
  prepareE2eDatabase,
  resolveE2eCredentials,
} from "../prepare-db";

export const AUTH_DIR = path.join(process.cwd(), "e2e/.auth");
export const STORAGE_STATE_PATH = path.join(AUTH_DIR, "user.json");
export const WORKSPACE_ID_PATH = path.join(AUTH_DIR, "workspace-id.txt");

export async function writeWorkspaceIdForSeedUser() {
  const { email } = resolveE2eCredentials();
  const prisma = new PrismaClient({
    datasources: { db: { url: E2E_DATABASE_URL } },
  });

  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { email },
      include: {
        user: {
          include: {
            workspaces: {
              orderBy: { id: "asc" },
              take: 1,
            },
          },
        },
      },
    });

    const workspaceId = userInfo?.user?.workspaces[0]?.id;
    if (workspaceId == null) {
      throw new Error(`No workspace found for seed user ${email}`);
    }

    fs.mkdirSync(AUTH_DIR, { recursive: true });
    fs.writeFileSync(WORKSPACE_ID_PATH, String(workspaceId), "utf8");
    return workspaceId;
  } finally {
    await prisma.$disconnect();
  }
}

export function readWorkspaceId(): string {
  if (!fs.existsSync(WORKSPACE_ID_PATH)) {
    throw new Error(
      `Missing ${WORKSPACE_ID_PATH}. Run e2e global setup / auth setup first.`,
    );
  }
  return fs.readFileSync(WORKSPACE_ID_PATH, "utf8").trim();
}

export async function prepareE2eEnvironment() {
  await prepareE2eDatabase();
  await writeWorkspaceIdForSeedUser();
}
