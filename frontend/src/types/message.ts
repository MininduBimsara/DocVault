export interface SourceCitation {
  docId: string;
  fileName: string;
  page?: number;
  chunkId?: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  sources?: SourceCitation[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  sessionId: string;
}
