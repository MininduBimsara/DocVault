import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Session } from "../../types/session";
import { sessionsApi } from "../../lib/sessionsApi";

interface SessionsState {
  sessions: Session[];
  activeSessionId: string | null;
  activeSession: Session | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SessionsState = {
  sessions: [],
  activeSessionId: null,
  activeSession: null,
  status: "idle",
  error: null,
};

export const fetchSessionsThunk = createAsyncThunk(
  "sessions/fetchAll",
  async () => {
    return await sessionsApi.getAll();
  },
);

export const createSessionThunk = createAsyncThunk(
  "sessions/create",
  async (title: string) => {
    return await sessionsApi.create(title);
  },
);

export const fetchSessionThunk = createAsyncThunk(
  "sessions/fetchOne",
  async (sessionId: string) => {
    return await sessionsApi.getOne(sessionId);
  },
);

export const updateSessionThunk = createAsyncThunk(
  "sessions/update",
  async ({ sessionId, docIds }: { sessionId: string; docIds: string[] }) => {
    return await sessionsApi.update(sessionId, docIds);
  },
);

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    setActiveSessionId: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
      if (!action.payload) {
        state.activeSession = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch all
      .addCase(fetchSessionsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSessionsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sessions = action.payload;
      })
      .addCase(fetchSessionsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch sessions";
      })
      // fetch one
      .addCase(fetchSessionThunk.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      // create
      .addCase(createSessionThunk.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.activeSessionId = action.payload.id;
        state.activeSession = action.payload;
      })
      // update
      .addCase(updateSessionThunk.fulfilled, (state, action) => {
        if (state.activeSession?.id === action.payload.id) {
          state.activeSession = action.payload;
        }
        const index = state.sessions.findIndex(
          (s) => s.id === action.payload.id,
        );
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
      });
  },
});

export const { setActiveSessionId } = sessionsSlice.actions;
export default sessionsSlice.reducer;
