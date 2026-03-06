import { fetchApi } from "./api";
import { Document } from "../types/document";

export const documentsApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
    const response = await fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || response.statusText,
      );
    }

    const data = await response.json();
    return data.document as Document;
  },

  getAll: async () => {
    const data = await fetchApi<{ documents: Document[] }>("/documents", {
      method: "GET",
    });
    return data.documents;
  },

  delete: (docId: string) =>
    fetchApi<{ message: string }>(`/documents/${docId}`, { method: "DELETE" }),
};
