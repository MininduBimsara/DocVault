"use client";

import { useAppSelector } from "../../store/hooks";
import DocSelector from "./DocSelector";

export default function SessionHeader() {
  const { activeSession } = useAppSelector((state) => state.sessions);

  if (!activeSession) return null;

  return (
    <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between flex-shrink-0">
      <div className="min-w-0 mr-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {activeSession.title}
        </h2>
      </div>
      <div className="flex-shrink-0">
        <DocSelector />
      </div>
    </div>
  );
}
