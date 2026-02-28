import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">DocVault Chat</h1>
        <p className="max-w-md text-lg text-zinc-500 dark:text-zinc-400">
          Multi-user RAG-powered document chat — coming soon.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
