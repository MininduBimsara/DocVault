"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/authSlice";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, status } = useAppSelector((s) => s.auth);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/login");
  };

  // Loading state
  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Guard – shouldn't render content if unauthenticated
  if (!user) return null;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
        <h1 className="text-lg font-bold">DocVault Chat</h1>
        <div className="flex items-center gap-4">
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {user.plan}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome, {user.email}
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Your plan: <strong>{user.plan}</strong> · Account created:{" "}
          {new Date(user.createdAt).toLocaleDateString()}
        </p>
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-zinc-600 dark:text-zinc-300">
            Document upload, chat sessions and RAG features are coming in the
            next phase. Stay tuned!
          </p>
        </div>
      </main>
    </div>
  );
}
