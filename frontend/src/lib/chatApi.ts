import { fetchApi } from "./api";
import { ChatResponse } from "../types/message";

export const chatApi = {
  send: (sessionId: string, question: string) =>
    fetchApi<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ sessionId, question }),
    }),
};
