export default function DocumentStatusBadge({ status }: { status: string }) {
  let colorClass =
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";

  switch (status) {
    case "UPLOADED":
      colorClass =
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      break;
    case "PROCESSING":
      colorClass =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      break;
    case "READY":
      colorClass =
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      break;
    case "FAILED":
      colorClass =
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      break;
  }

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
}
