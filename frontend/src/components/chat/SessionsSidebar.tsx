"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createSessionThunk,
  setActiveSessionId,
} from "../../store/slices/sessionsSlice";

export default function SessionsSidebar() {
  const { sessions, activeSessionId, status } = useAppSelector(
    (state) => state.sessions,
  );
  const dispatch = useAppDispatch();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    await dispatch(createSessionThunk(newTitle));
    setNewTitle("");
    setIsCreating(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New chat title..."
            className="flex-1 min-w-0 p-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating || !newTitle.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors flex-shrink-0"
            title="Create session"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {status === "loading" && sessions.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-4">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-8 px-4">
            Create your first chat session to get started.
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => dispatch(setActiveSessionId(session.id))}
              className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                activeSessionId === session.id
                  ? "bg-blue-100/50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-medium"
                  : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <div className="truncate">{session.title}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
