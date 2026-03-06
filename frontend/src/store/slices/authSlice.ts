import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { User } from "../../types/auth";
import { authApi } from "../../lib/authApi";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: any) => {
    return await authApi.login(credentials);
  },
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (credentials: any) => {
    return await authApi.register(credentials);
  },
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await authApi.logout();
});

export const fetchMeThunk = createAsyncThunk("auth/fetchMe", async () => {
  return await authApi.me();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchMe
      .addCase(fetchMeThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        state.status = "unauthenticated";
        state.user = null;
      })
      // login
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message || "Failed to login";
      })
      // register
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message || "Failed to register";
      })
      // logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.status = "unauthenticated";
        state.user = null;
      });
  },
});

export default authSlice.reducer;
