import axios from "axios";
import { env } from "../config/env";

export interface RagChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface RagChatSource {
  docId: string;
  fileName: string;
  page?: number;
  chunkId?: string;
  snippet?: string;
}

export interface RagChatRequest {
  userId: string;
  docIds: string[];
  history: RagChatMessage[];
  question: string;
}

export interface RagChatResponse {
  answer: string;
  sources: RagChatSource[];
}

const ragAxios = axios.create({
  baseURL: env.RAG_SERVICE_URL,
  timeout: env.RAG_CHAT_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    INTERNAL_RAG_KEY: env.INTERNAL_RAG_KEY,
  },
});

function makeError(statusCode: number, message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  return err;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSource(value: unknown): RagChatSource | null {
  if (!isObject(value)) return null;

  const docId = value.docId;
  const fileName = value.fileName;
  if (typeof docId !== "string" || typeof fileName !== "string") {
    return null;
  }

  const source: RagChatSource = {
    docId,
    fileName,
  };

  if (typeof value.page === "number") source.page = value.page;
  if (typeof value.chunkId === "string") source.chunkId = value.chunkId;
  if (typeof value.snippet === "string") source.snippet = value.snippet;

  return source;
}

export async function chatWithRag(
  payload: RagChatRequest,
): Promise<RagChatResponse> {
  try {
    const response = await ragAxios.post("/rag/chat", payload);
    const data = response.data;

    if (!isObject(data) || typeof data.answer !== "string") {
      throw makeError(502, "Invalid RAG response payload");
    }

    const rawSources = Array.isArray(data.sources) ? data.sources : [];
    const sources = rawSources
      .map((source) => parseSource(source))
      .filter((source): source is RagChatSource => source !== null);

    return {
      answer: data.answer,
      sources,
    };
  } catch (err: any) {
    if (err?.statusCode) throw err;
    throw makeError(502, "Failed to reach RAG service");
  }
}
