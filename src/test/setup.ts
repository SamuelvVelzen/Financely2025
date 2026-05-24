import path from "node:path";
import { config } from "dotenv";

config({ path: ".env" });

const testDbPath = path.join(process.cwd(), "prisma/data/test.db");
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.RATE_LIMIT_DISABLED = "true";
process.env.NODE_ENV = "test";
