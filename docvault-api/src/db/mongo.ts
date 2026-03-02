import mongoose from "mongoose";
import { env } from "../config/env";

/**
 * Connect to MongoDB using MONGO_URI from environment.
 * Logs success or throws on failure (fail-fast).
 */
export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("[docvault-api] Mongo connected");
  } catch (err) {
    console.error(
      "[docvault-api] Mongo connection failed:",
      err instanceof Error ? err.message : err,
    );
    throw err; // caller (bootstrap) will process.exit(1)
  }
}

/**
 * Gracefully close the MongoDB connection.
 * Useful for tests and clean process shutdown.
 */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log("[docvault-api] Mongo disconnected");
}
