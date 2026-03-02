import fs from "fs";
import { env } from "./config/env";
import app from "./app";
import { connectDB } from "./db/mongo";

// ── Ensure shared-storage directory exists ───────────────────────────────────
function ensureSharedStorage(): void {
  if (!fs.existsSync(env.FILE_STORAGE_PATH)) {
    fs.mkdirSync(env.FILE_STORAGE_PATH, { recursive: true });
    console.log(
      `[docvault-api] Created shared storage at: ${env.FILE_STORAGE_PATH}`,
    );
  } else {
    console.log(
      `[docvault-api] Shared storage path OK: ${env.FILE_STORAGE_PATH}`,
    );
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  ensureSharedStorage();
  await connectDB(); // throws on failure → caught below → process.exit(1)

  app.listen(env.PORT, () => {
    console.log("");
    console.log("┌────────────────────────────────────────────────────┐");
    console.log("│              docvault-api  ✓  RUNNING              │");
    console.log("├────────────────────────────────────────────────────┤");
    console.log(
      `│  URL               http://localhost:${env.PORT}           │`,
    );
    console.log(`│  RAG Service       ${env.RAG_SERVICE_URL.padEnd(28)} │`);
    console.log(
      `│  File Storage      ${env.FILE_STORAGE_PATH.slice(-28).padEnd(28)} │`,
    );
    console.log("└────────────────────────────────────────────────────┘");
    console.log("");
  });
}

bootstrap().catch((err) => {
  console.error("[docvault-api] Fatal startup error:", err.message);
  process.exit(1);
});
