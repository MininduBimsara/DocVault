"use client";

import { useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import { fetchSessionsThunk } from "../../store/slices/sessionsSlice";
import { fetchDocumentsThunk } from "../../store/slices/documentsSlice";
import ProtectedRoute from "../../components/layout/ProtectedRoute";
import Topbar from "../../components/layout/Topbar";
import SessionsSidebar from "../../components/chat/SessionsSidebar";
import SessionHeader from "../../components/chat/SessionHeader";
import ChatThread from "../../components/chat/ChatThread";
import ChatInput from "../../components/chat/ChatInput";

export default function ChatPage() {
  const dispatch = useAppDispatch();

  // Load initial data for chat
  useEffect(() => {
    dispatch(fetchSessionsThunk());
    dispatch(fetchDocumentsThunk());
  }, [dispatch]);

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <Topbar />

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 md:w-80 flex-shrink-0 hidden sm:flex">
            <SessionsSidebar />
          </div>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
            <SessionHeader />
            <ChatThread />
            <ChatInput />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
