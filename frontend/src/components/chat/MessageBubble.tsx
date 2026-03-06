import { Message } from "../../types/message";
import CitationList from "./CitationList";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (message.role === "system") return null;

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "" : ""}`}>
        <div
          className={`px-5 py-3.5 rounded-2xl ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-sm shadow-sm"
          }`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
            {message.content}
          </div>

          {!isUser && message.sources && (
            <CitationList sources={message.sources} />
          )}
        </div>

        <div
          className={`text-xs mt-1.5 text-zinc-400 ${isUser ? "text-right" : "text-left"}`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
