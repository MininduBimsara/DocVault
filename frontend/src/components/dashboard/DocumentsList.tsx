"use client";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { deleteDocumentThunk } from "../../store/slices/documentsSlice";
import DocumentStatusBadge from "./DocumentStatusBadge";

export default function DocumentsList() {
  const { items, status } = useAppSelector((state) => state.documents);
  const dispatch = useAppDispatch();

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      dispatch(deleteDocumentThunk(id));
    }
  };

  if (status === "loading" && items.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Your Documents
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            You haven&apos;t uploaded any documents yet.
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Upload a PDF above to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs tracking-wider text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="truncate max-w-xs xl:max-w-md">
                      {doc.fileName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DocumentStatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 px-3 py-1 rounded-md"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
