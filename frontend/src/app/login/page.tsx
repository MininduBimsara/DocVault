import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">DocVault</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Your AI-powered document assistant
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
