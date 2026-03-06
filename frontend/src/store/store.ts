import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import documentsReducer from "./slices/documentsSlice";
import sessionsReducer from "./slices/sessionsSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    sessions: sessionsReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
