import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchMe,
  loginUser,
  logoutUser,
  registerUser,
  type SafeUser,
} from "@/lib/authApi";

// ---------- State ----------

type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

interface AuthState {
  user: SafeUser | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

// ---------- Thunks ----------

export const registerThunk = createAsyncThunk(
  "auth/register",
  async ({ email, password }: { email: string; password: string }) => {
    return await registerUser(email, password);
  },
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    return await loginUser(email, password);
  },
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await logoutUser();
});

export const fetchMeThunk = createAsyncThunk("auth/me", async () => {
  return await fetchMe();
});

// ---------- Slice ----------

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ---- register ----
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Registration failed";
      });

    // ---- login ----
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Login failed";
      });

    // ---- logout ----
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.status = "unauthenticated";
      state.user = null;
      state.error = null;
    });

    // ---- fetchMe ----
    builder
      .addCase(fetchMeThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = null;
      });
  },
});

export default authSlice.reducer;
