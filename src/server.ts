import { runWithD1Prisma } from "@/features/util/prisma";
import type { D1Database, ExecutionContext } from "@cloudflare/workers-types";
import handler from "@tanstack/react-start/server-entry";

type FinancelyWorkerEnv = {
  DB: D1Database;
};

const worker = {
  fetch(request: Request, env: FinancelyWorkerEnv, _ctx: ExecutionContext) {
    return runWithD1Prisma(env.DB, () => handler.fetch(request));
  },
};

export default worker;
