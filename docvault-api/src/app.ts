import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import healthRouter from "./routes/health.route";
import authRouter from "./routes/auth.route";
import protectedRouter from "./routes/protected.route";
import documentsRouter from "./routes/documents.route";
import internalRouter from "./routes/internal.route";
import sessionsRouter from "./routes/sessions.route";
import chatRouter from "./routes/chat.route";

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

// Allow the frontend origin to send cookies cross-origin
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/protected", protectedRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/chat", chatRouter);

// ── Internal service-to-service routes (not user-facing) ─────────────────────
// Secured via INTERNAL_RAG_KEY header — see src/middleware/internalKey.middleware.ts
app.use("/internal", internalRouter);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
