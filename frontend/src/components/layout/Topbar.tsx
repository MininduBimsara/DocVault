"use client";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/slices/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Topbar() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <h1 className="font-bold text-xl tracking-tight">DocVault</h1>
        <nav className="hidden md:flex gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/chat"
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Chat
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline-block">
              {user.email}{" "}
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full ml-2">
                {user.plan}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <div className="flex gap-4">
            <Link href="/login" className="text-sm hover:underline">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
