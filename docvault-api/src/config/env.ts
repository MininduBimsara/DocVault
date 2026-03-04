import dotenv from "dotenv";
import path from "path";

dotenv.config();

const required = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "FRONTEND_ORIGIN",
  "RAG_SERVICE_URL",
  "INTERNAL_RAG_KEY",
  "FILE_STORAGE_PATH",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `[docvault-api] Missing required environment variable: ${key}`,
    );
  }
}

export const env = {
  PORT: parseInt(process.env.PORT!, 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // Mongo
  MONGO_URI: process.env.MONGO_URI!,
  // JWT / auth
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  COOKIE_NAME: process.env.COOKIE_NAME ?? "docvault_token",
  // CORS
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN!,
  // Internal
  RAG_SERVICE_URL: process.env.RAG_SERVICE_URL!,
  INTERNAL_RAG_KEY: process.env.INTERNAL_RAG_KEY!,
  // Resolve relative to the config dir (two levels up to repo root)
  FILE_STORAGE_PATH: path.resolve(
    __dirname,
    "..",
    "..",
    process.env.FILE_STORAGE_PATH!,
  ),
};
