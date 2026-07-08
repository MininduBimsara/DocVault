import { fetchApi } from "./api";
import { SourceCitation } from "../types/message";

export interface ReviewTask {
  _id: string;
  userId: {
    _id: string;
    email: string;
  };
  sessionId: string;
  messageId: string;
  question: string;
  draftAnswer: string;
  sources: Array<SourceCitation & { similarityScore: number }>;
  confidenceScore: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EDITED";
  createdAt: string;
}

export const reviewsApi = {
  getPending: () =>
    fetchApi<{ tasks: ReviewTask[] }>("/reviews/pending", {
      method: "GET",
    }),
  approve: (taskId: string) =>
    fetchApi<{ success: boolean; message: string }>(`/reviews/${taskId}/approve`, {
      method: "POST",
    }),
  reject: (taskId: string) =>
    fetchApi<{ success: boolean; message: string }>(`/reviews/${taskId}/reject`, {
      method: "POST",
    }),
  edit: (taskId: string, finalAnswer: string) =>
    fetchApi<{ success: boolean; message: string }>(`/reviews/${taskId}/edit`, {
      method: "POST",
      body: JSON.stringify({ finalAnswer }),
    }),
};
