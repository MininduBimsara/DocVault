"use client";

import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  sendChatThunk,
  addOptimisticMessage,
} from "../../store/slices/chatSlice";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const { activeSession } = useAppSelector((state) => state.sessions);
  const { sending } = useAppSelector((state) => state.chat);
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const disabled =
    !activeSession || sending || activeSession.selectedDocIds?.length === 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const text = input.trim();
    if (!text || disabled || !activeSession) return;

    setInput("");

    // Optimistic UI
    dispatch(
      addOptimisticMessage({
        sessionId: activeSession.id,
        message: {
          id: `temp-${Date.now()}`,
          role: "user",
          content: text,
          createdAt: new Date().toISOString(),
        },
      }),
    );

    await dispatch(
      sendChatThunk({
        sessionId: activeSession.id,
        question: text,
      }),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Focus input when session changes
  useEffect(() => {
    if (activeSession && !disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSession, disabled]);

  return (
    <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto relative">
        {activeSession && activeSession.selectedDocIds?.length === 0 && (
          <div className="absolute bottom-full mb-3 left-0 right-0 flex justify-center">
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 text-xs px-3 py-1.5 rounded-full font-medium">
              Select at least one document to start chatting
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-end bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent p-1 transition-all"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              !activeSession
                ? "Select a session to start"
                : disabled
                  ? "Select documents first"
                  : "Ask a question about your documents... (Shift+Enter for newline)"
            }
            className="flex-1 max-h-48 min-h-[44px] p-2.5 resize-none bg-transparent outline-none disabled:opacity-50 text-sm"
            rows={Math.min(5, input.split("\n").length)}
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="p-2.5 m-0.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {sending ? (
              <svg
                className="animate-spin w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </form>
        <div className="text-center mt-2 text-xs text-zinc-400">
          DocVault AI can make mistakes. Verify information using the provided
          citations.
        </div>
      </div>
    </div>
  );
}
