import dotenv from "dotenv";
import path from "path";

dotenv.config();

const required = [
  "PORT",
  "MONGO_URI",
  "RAG_SERVICE_URL",
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
  MONGO_URI: process.env.MONGO_URI ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  RAG_SERVICE_URL: process.env.RAG_SERVICE_URL!,
  INTERNAL_RAG_KEY: process.env.INTERNAL_RAG_KEY ?? "",
  // Resolve relative to the server.ts location (project root)
  FILE_STORAGE_PATH: path.resolve(
    __dirname,
    "..",
    "..",
    process.env.FILE_STORAGE_PATH!,
  ),
};
