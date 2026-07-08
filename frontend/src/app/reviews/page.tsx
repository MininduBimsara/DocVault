"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/layout/ProtectedRoute";
import Topbar from "../../components/layout/Topbar";
import { reviewsApi, ReviewTask } from "../../lib/reviewsApi";

export default function ReviewsPage() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
  const [draftText, setDraftText] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.getPending();
      setTasks(data.tasks);
      if (data.tasks.length > 0) {
        // Keep selection or default to first
        const match = data.tasks.find((t) => t._id === selectedTask?._id);
        const nextSelected = match || data.tasks[0];
        setSelectedTask(nextSelected);
        setDraftText(nextSelected.draftAnswer);
      } else {
        setSelectedTask(null);
        setDraftText("");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch pending reviews. You may not have reviewer permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const selectTask = (task: ReviewTask) => {
    setSelectedTask(task);
    setDraftText(task.draftAnswer);
  };

  const handleApprove = async () => {
    if (!selectedTask || actioning) return;
    try {
      setActioning(true);
      if (draftText.trim() !== selectedTask.draftAnswer.trim()) {
        // If modified, use edit endpoint
        await reviewsApi.edit(selectedTask._id, draftText);
      } else {
        await reviewsApi.approve(selectedTask._id);
      }
      await fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to approve response.");
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTask || actioning) return;
    if (!window.confirm("Are you sure you want to reject this response? The user will receive a refusal notification.")) {
      return;
    }
    try {
      setActioning(true);
      await reviewsApi.reject(selectedTask._id);
      await fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to reject response.");
    } finally {
      setActioning(false);
    }
  };

  const getConfColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30";
    if (score >= 0.7) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30";
    return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/30";
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <Topbar />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Review Tasks Queue List */}
          <aside className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Review Queue</span>
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {tasks.length}
                </span>
              </h2>
              <button
                onClick={fetchTasks}
                className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refresh queue"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.22 8.561M3.75 6h.01" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading && tasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">Loading queue...</div>
              ) : tasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">All Clear!</p>
                  <p className="text-xs text-zinc-400 mt-1">No pending messages require review.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => selectTask(task)}
                    className={`w-full text-left p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/20 flex flex-col gap-1.5 ${
                      selectedTask?._id === task._id ? "bg-blue-50/40 dark:bg-blue-950/10 border-l-4 border-blue-600" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase truncate">
                        {task.userId.email}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase whitespace-nowrap ${getConfColor(task.confidenceScore)}`}>
                        CS {(task.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug">
                      {task.question}
                    </p>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className="flex-1 flex overflow-hidden bg-white dark:bg-zinc-950">
            {error ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center bg-red-50/10">
                <div className="max-w-md">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Access Denied</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-4">{error}</p>
                </div>
              </div>
            ) : !selectedTask ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 p-8">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-lg font-medium">Select a task to review</p>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                {/* Editor Section */}
                <section className="flex-1 flex flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-800 p-6 gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">User Question</h3>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 leading-relaxed">
                      {selectedTask.question}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Draft Response Editor</h3>
                      {draftText.trim() !== selectedTask.draftAnswer.trim() && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/30">
                          Edits pending save
                        </span>
                      )}
                    </div>
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      className="flex-1 p-4 border border-zinc-300 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 resize-none font-mono text-sm leading-relaxed"
                    />
                  </div>

                  {/* Actions Header Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={handleReject}
                      disabled={actioning}
                      className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      Reject Answer
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actioning}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {actioning ? "Processing..." : draftText.trim() !== selectedTask.draftAnswer.trim() ? "Approve & Publish Edits" : "Approve Response"}
                    </button>
                  </div>
                </section>

                {/* Right Context Inspector Sidebar */}
                <section className="w-80 overflow-y-auto p-6 flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Retrieved Citations</h3>
                  {selectedTask.sources.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 border border-dashed rounded-lg">
                      No matching sources found.
                    </div>
                  ) : (
                    selectedTask.sources.map((source, index) => (
                      <div
                        key={source.chunkId || index}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col gap-2.5 text-xs"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Source {index + 1}
                          </span>
                          <span className="font-semibold text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            Pg {source.page ?? "n/a"}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium truncate" title={source.fileName}>
                          {source.fileName}
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 italic bg-zinc-50 dark:bg-zinc-950 p-2 rounded leading-relaxed border border-zinc-100 dark:border-zinc-900/50 break-words whitespace-pre-wrap">
                          &ldquo;{source.snippet}&rdquo;
                        </p>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] text-zinc-400 font-semibold uppercase">
                            <span>Cosine Similarity</span>
                            <span>{(source.similarityScore * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-zinc-150 dark:bg-zinc-800 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, source.similarityScore * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
