"use client";

import { useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import { fetchDocumentsThunk } from "../../store/slices/documentsSlice";
import ProtectedRoute from "../../components/layout/ProtectedRoute";
import Topbar from "../../components/layout/Topbar";
import UploadCard from "../../components/dashboard/UploadCard";
import DocumentsList from "../../components/dashboard/DocumentsList";
import Link from "next/link";

export default function DashboardPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initial fetch
    dispatch(fetchDocumentsThunk());

    // Poll every 5 seconds
    const interval = setInterval(() => {
      dispatch(fetchDocumentsThunk());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Topbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Dashboard
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                Manage your documents and start chatting
              </p>
            </div>
            <Link
              href="/chat"
              className="bg-zinc-900 hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex flex-shrink-0 items-center gap-2"
            >
              Open Chat
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-1">
              <UploadCard />
            </div>
            <div className="lg:col-span-2">
              <DocumentsList />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
