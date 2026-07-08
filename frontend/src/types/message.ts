export interface SourceCitation {
  docId: string;
  fileName: string;
  page?: number;
  chunkId?: string;
  snippet?: string;
  similarityScore?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  sources?: SourceCitation[];
  status?: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  sessionId: string;
  status: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
}
