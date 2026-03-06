import { fetchApi } from "./api";
import { Session } from "../types/session";
import { Message } from "../types/message";

export const sessionsApi = {
  getAll: async () => {
    const data = await fetchApi<{ sessions: Session[] }>("/sessions", {
      method: "GET",
    });
    return data.sessions;
  },

  getOne: async (sessionId: string) => {
    const data = await fetchApi<{ session: Session }>(
      `/sessions/${sessionId}`,
      { method: "GET" },
    );
    return data.session;
  },

  create: async (title: string) => {
    const data = await fetchApi<{ session: Session }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    return data.session;
  },

  update: async (sessionId: string, selectedDocIds: string[]) => {
    const data = await fetchApi<{ session: Session }>(
      `/sessions/${sessionId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ selectedDocIds }),
      },
    );
    return data.session;
  },

  delete: (sessionId: string) =>
    fetchApi<{ message: string }>(`/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  getMessages: async (sessionId: string, limit: number = 20) => {
    const data = await fetchApi<{ messages: Message[] }>(
      `/sessions/${sessionId}/messages?limit=${limit}`,
      {
        method: "GET",
      },
    );
    return data.messages;
  },
};
