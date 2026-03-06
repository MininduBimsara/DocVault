"use client";

import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { fetchMessagesThunk } from "../../store/slices/chatSlice";
import MessageBubble from "./MessageBubble";

export default function ChatThread() {
  const { activeSession } = useAppSelector((state) => state.sessions);
  const { messagesBySessionId } = useAppSelector((state) => state.chat);
  const dispatch = useAppDispatch();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = activeSession
    ? messagesBySessionId[activeSession.id] || []
    : [];

  // Fetch messages when active session changes
  useEffect(() => {
    if (activeSession) {
      dispatch(fetchMessagesThunk(activeSession.id));
    }
  }, [activeSession, dispatch]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-8 text-center">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Welcome to DocVault Chat
        </h3>
        <p className="text-zinc-500 max-w-sm">
          Select or create a session from the sidebar to start asking questions
          about your documents.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full flex flex-col items-center bg-white dark:bg-zinc-950 px-4 py-8">
      <div className="w-full max-w-4xl flex-1 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Send a message to start the conversation...
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} className="h-4 flex-shrink-0" />
      </div>
    </div>
  );
}
