import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">DocVault</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Join today to chat with your documents
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
