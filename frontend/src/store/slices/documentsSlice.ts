import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Document } from "../../types/document";
import { documentsApi } from "../../lib/documentsApi";

interface DocumentsState {
  items: Document[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetchedAt: number | null;
}

const initialState: DocumentsState = {
  items: [],
  status: "idle",
  error: null,
  lastFetchedAt: null,
};

export const fetchDocumentsThunk = createAsyncThunk(
  "documents/fetchAll",
  async () => {
    return await documentsApi.getAll();
  },
);

export const uploadDocumentThunk = createAsyncThunk(
  "documents/upload",
  async (file: File) => {
    return await documentsApi.upload(file);
  },
);

export const deleteDocumentThunk = createAsyncThunk(
  "documents/delete",
  async (docId: string) => {
    await documentsApi.delete(docId);
    return docId;
  },
);

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchDocumentsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDocumentsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchDocumentsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch documents";
      })
      // upload
      .addCase(uploadDocumentThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // delete
      .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((doc) => doc.id !== action.payload);
      });
  },
});

export default documentsSlice.reducer;
