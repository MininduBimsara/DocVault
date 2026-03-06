import { fetchApi } from "./api";
import { User } from "../types/auth";

export const authApi = {
  register: async (data: any) => {
    const res = await fetchApi<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.user;
  },
  login: async (data: any) => {
    const res = await fetchApi<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.user;
  },
  logout: () =>
    fetchApi<{ message: string }>("/auth/logout", { method: "POST" }),
  me: async () => {
    const res = await fetchApi<{ user: User }>("/auth/me", { method: "GET" });
    return res.user;
  },
};
