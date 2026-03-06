import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Message, ChatResponse } from "../../types/message";
import { sessionsApi } from "../../lib/sessionsApi";
import { chatApi } from "../../lib/chatApi";

interface ChatState {
  messagesBySessionId: Record<string, Message[]>;
  sending: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messagesBySessionId: {},
  sending: false,
  error: null,
};

export const fetchMessagesThunk = createAsyncThunk(
  "chat/fetchMessages",
  async (sessionId: string) => {
    const messages = await sessionsApi.getMessages(sessionId);
    return { sessionId, messages };
  },
);

export const sendChatThunk = createAsyncThunk(
  "chat/send",
  async ({ sessionId, question }: { sessionId: string; question: string }) => {
    return await chatApi.send(sessionId, question);
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addOptimisticMessage: (
      state,
      action: PayloadAction<{ sessionId: string; message: Message }>,
    ) => {
      const { sessionId, message } = action.payload;
      if (!state.messagesBySessionId[sessionId]) {
        state.messagesBySessionId[sessionId] = [];
      }
      state.messagesBySessionId[sessionId].push(message);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch messages
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        state.messagesBySessionId[action.payload.sessionId] =
          action.payload.messages.reverse(); // assuming backend returns latest first
      })
      // send message
      .addCase(sendChatThunk.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendChatThunk.fulfilled, (state, action) => {
        state.sending = false;
        const { sessionId, answer, sources } = action.payload;

        if (!state.messagesBySessionId[sessionId]) {
          state.messagesBySessionId[sessionId] = [];
        }

        // Add assistant message
        state.messagesBySessionId[sessionId].push({
          id: Date.now().toString(), // temporary id
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString(),
          sources,
        });
      })
      .addCase(sendChatThunk.rejected, (state, action) => {
        state.sending = false;
        state.error = action.error.message || "Failed to send message";
      });
  },
});

export const { addOptimisticMessage } = chatSlice.actions;
export default chatSlice.reducer;
