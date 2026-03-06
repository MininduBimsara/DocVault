import { SourceCitation } from "../../types/message";

export default function CitationList({
  sources,
}: {
  sources: SourceCitation[];
}) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Sources
      </h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <div
            key={i}
            className="inline-flex items-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded px-2 py-1 text-xs cursor-help transition-colors group relative"
            title={source.snippet}
          >
            <svg
              className="w-3 h-3 mr-1.5 text-zinc-400"
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
            <span className="truncate max-w-[150px]">{source.fileName}</span>
            {source.page && (
              <span className="ml-1 text-zinc-500">— p. {source.page}</span>
            )}

            {/* Tooltip for snippet */}
            {source.snippet && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-zinc-900 text-zinc-100 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                <div className="line-clamp-4">{source.snippet}</div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
