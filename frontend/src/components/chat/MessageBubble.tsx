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
          <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap text-sm">
            {message.status === "PENDING_REVIEW" ? (
              <div className="flex flex-col gap-2.5 py-1">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                  <svg className="animate-spin w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verification in progress...</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 italic text-sm mt-0.5">
                  An administrator is verifying this answer against the source documents.
                </p>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700/60 rounded w-5/6 animate-pulse mt-1" />
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700/60 rounded w-3/4 animate-pulse" />
              </div>
            ) : (
              message.content
            )}
          </div>

          {!isUser && message.status !== "PENDING_REVIEW" && message.sources && message.sources.length > 0 && (
            <CitationList sources={message.sources} />
          )}

          {!isUser && message.status !== "PENDING_REVIEW" && (
            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Verified Grounding</span>
            </div>
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
