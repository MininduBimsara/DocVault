"use client";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateSessionThunk } from "../../store/slices/sessionsSlice";
import { useState } from "react";

export default function DocSelector() {
  const { activeSession } = useAppSelector((state) => state.sessions);
  const { items: documents } = useAppSelector((state) => state.documents);
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeSession) return null;

  const readyDocs = documents.filter((doc) => doc.status === "READY");
  const selectedCount = activeSession.selectedDocIds?.length || 0;

  const toggleDoc = async (docId: string) => {
    if (!activeSession) return;

    let newSelected: string[];
    if (activeSession.selectedDocIds?.includes(docId)) {
      newSelected = activeSession.selectedDocIds.filter((id) => id !== docId);
    } else {
      newSelected = [...(activeSession.selectedDocIds || []), docId];
    }

    await dispatch(
      updateSessionThunk({
        sessionId: activeSession.id,
        docIds: newSelected,
      }),
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
      >
        <svg
          className="w-4 h-4 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {selectedCount} document{selectedCount !== 1 ? "s" : ""} selected
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-20 overflow-hidden">
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Select Session Documents
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Chat will only search chosen files.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
              {readyDocs.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                  No READY documents available.
                </div>
              ) : (
                <div className="space-y-1">
                  {readyDocs.map((doc) => {
                    const isSelected =
                      activeSession.selectedDocIds?.includes(doc.id) || false;
                    return (
                      <label
                        key={doc.id}
                        className="flex items-start gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDoc(doc.id)}
                          className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-zinc-800 dark:bg-zinc-700 dark:border-zinc-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {doc.fileName}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
